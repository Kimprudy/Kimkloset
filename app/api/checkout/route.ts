import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { initializeTransaction } from '@/lib/paystack';
import { generateOrderNumber } from '@/lib/orders';
import { SHIPPING_FEE, siteUrl } from '@/lib/config';

export const dynamic = 'force-dynamic';

type CheckoutBody = {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
};

type CartRow = {
  quantity: number;
  size: string;
  color: string;
  product_id: string;
  products: { id: string; name: string; price: number; image_url: string; is_active: boolean; stock: number } | null;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/checkout
 * 1. Checks who is logged in
 * 2. Reads THEIR cart from the database and recalculates prices (never trusts the browser)
 * 3. Saves a "pending" order
 * 4. Asks Paystack for a payment link and returns it
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return bad('Please sign in to check out.', 401);

  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return bad('Invalid request.');
  }

  const fullName = body.fullName?.trim() ?? '';
  const phone = body.phone?.trim() ?? '';
  const address = body.address?.trim() ?? '';
  const city = body.city?.trim() ?? '';
  const state = body.state?.trim() ?? '';

  if (fullName.length < 2) return bad('Please enter your full name.');
  if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) return bad('Please enter a valid phone number.');
  if (address.length < 5) return bad('Please enter your delivery address.');
  if (city.length < 2) return bad('Please enter your city.');
  if (!state) return bad('Please choose your state.');

  const admin = createAdminClient();

  const { data: cartRows, error: cartError } = await admin
    .from('cart_items')
    .select('quantity, size, color, product_id, products(id, name, price, image_url, is_active, stock)')
    .eq('user_id', user.id)
    .returns<CartRow[]>();

  if (cartError) {
    console.error('[checkout] cart load failed', cartError);
    return bad('Could not load your cart. Please try again.', 500);
  }

  const lines = (cartRows ?? []).filter((r) => r.products && r.products.is_active);
  if (lines.length === 0) return bad('Your cart is empty.');

  // Stock check: add up each product across sizes/colours and compare to what's left
  const wanted = new Map<string, { name: string; qty: number; stock: number }>();
  for (const r of lines) {
    const w = wanted.get(r.product_id) ?? { name: r.products!.name, qty: 0, stock: r.products!.stock };
    w.qty += r.quantity;
    wanted.set(r.product_id, w);
  }
  for (const w of Array.from(wanted.values())) {
    if (w.stock <= 0) return bad(`${w.name} is sold out. Please remove it from your cart.`, 409);
    if (w.qty > w.stock) {
      return bad(`Only ${w.stock} of ${w.name} left. Please reduce the quantity in your cart.`, 409);
    }
  }

  const subtotal = lines.reduce((sum, r) => sum + r.products!.price * r.quantity, 0);
  const shippingFee = SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const orderNumber = generateOrderNumber();

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: 'pending',
      payment_reference: orderNumber,
      subtotal,
      shipping_fee: shippingFee,
      total,
      currency: 'NGN',
      customer_name: fullName,
      customer_email: user.email,
      customer_phone: phone,
      shipping_address: address,
      city,
      state,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('[checkout] order insert failed', orderError);
    return bad('Could not create your order. Please try again.', 500);
  }

  const { error: itemsError } = await admin.from('order_items').insert(
    lines.map((r) => ({
      order_id: order.id,
      product_id: r.product_id,
      product_name: r.products!.name,
      product_image: r.products!.image_url,
      size: r.size,
      color: r.color,
      unit_price: r.products!.price,
      quantity: r.quantity,
      line_total: r.products!.price * r.quantity,
    }))
  );

  if (itemsError) {
    console.error('[checkout] order items insert failed', itemsError);
    await admin.from('orders').delete().eq('id', order.id);
    return bad('Could not create your order. Please try again.', 500);
  }

  // Remember name/phone for next time
  await admin.from('profiles').update({ full_name: fullName, phone, updated_at: new Date().toISOString() }).eq('id', user.id);

  // Send Paystack back to whichever site the customer is on (localhost or Vercel)
  const origin = request.headers.get('origin') || siteUrl();

  try {
    const payment = await initializeTransaction({
      email: user.email,
      amountKobo: total * 100,
      reference: orderNumber,
      callbackUrl: `${origin}/checkout/success`,
      metadata: { order_id: order.id, user_id: user.id, store: 'Kimkloset' },
    });
    return NextResponse.json({ authorizationUrl: payment.authorization_url, orderNumber });
  } catch (err) {
    console.error('[checkout] paystack init failed', err);
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id);
    return bad('We could not reach the payment provider. Please try again.', 502);
  }
}
