import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { fetchCart } from '@/lib/cart';
import { apiError, SIGN_IN_REQUIRED } from '@/lib/api';
import { MAX_QTY } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** GET /api/cart — the signed-in user's cart. */
export async function GET(request: Request) {
  const { user, supabase } = await getRequestUser(request);
  if (!user) return apiError(SIGN_IN_REQUIRED, 401);

  try {
    return NextResponse.json({ items: await fetchCart(supabase, user.id) });
  } catch (err) {
    console.error('[api/cart] load failed', err);
    return apiError('Could not load your cart. Please try again.', 500);
  }
}

type AddBody = { productId?: string; size?: string; color?: string; quantity?: number };

/**
 * POST /api/cart — add an item. Body: { productId, size, color, quantity }
 * If the same product/size/colour is already in the cart, the quantities are added together.
 * The total is capped at the stock left and at MAX_QTY.
 */
export async function POST(request: Request) {
  const { user, supabase } = await getRequestUser(request);
  if (!user) return apiError(SIGN_IN_REQUIRED, 401);

  let body: AddBody;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid request.');
  }

  const quantity = Math.floor(Number(body.quantity ?? 1));
  if (!body.productId || !Number.isFinite(quantity) || quantity < 1) return apiError('Invalid request.');

  const { data: product } = await supabase
    .from('products')
    .select('id, name, sizes, colors, stock')
    .eq('id', body.productId)
    .eq('is_active', true)
    .maybeSingle<{ id: string; name: string; sizes: string[]; colors: string[]; stock: number }>();
  if (!product) return apiError('This product is no longer available.', 404);

  // Products without sizes/colours are stored with '' (same as the website)
  const size = product.sizes.length > 0 ? body.size ?? '' : '';
  const color = product.colors.length > 0 ? body.color ?? '' : '';
  if (product.sizes.length > 0 && !product.sizes.includes(size)) return apiError('Please choose a size.');
  if (product.colors.length > 0 && !product.colors.includes(color)) return apiError('Please choose a colour.');
  if (product.stock <= 0) return apiError(`${product.name} is sold out.`, 409);

  const cap = Math.min(MAX_QTY, product.stock);

  const { data: existing, error: findError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', product.id)
    .eq('size', size)
    .eq('color', color)
    .maybeSingle();
  if (findError) {
    console.error('[api/cart] find failed', findError);
    return apiError('Could not update your cart. Please try again.', 500);
  }

  const { error } = existing
    ? await supabase
        .from('cart_items')
        .update({ quantity: Math.min(cap, existing.quantity + quantity), updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    : await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: product.id, size, color, quantity: Math.min(cap, quantity) });
  if (error) {
    console.error('[api/cart] save failed', error);
    return apiError('Could not update your cart. Please try again.', 500);
  }

  try {
    return NextResponse.json({ items: await fetchCart(supabase, user.id) });
  } catch (err) {
    console.error('[api/cart] reload failed', err);
    return apiError('Could not load your cart. Please try again.', 500);
  }
}
