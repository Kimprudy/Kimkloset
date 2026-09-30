import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CheckCircle2, Clock, Mail, XCircle } from 'lucide-react';
import RefreshCart from '@/components/RefreshCart';
import EmptyState from '@/components/EmptyState';
import OrderTotals from '@/components/OrderTotals';
import { createClient } from '@/lib/supabase/server';
import { finalizeOrder } from '@/lib/orders';
import { formatNaira } from '@/lib/format';

export const metadata: Metadata = { title: 'Order confirmation' };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ reference?: string; trxref?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const reference = sp.reference || sp.trxref;

  if (!reference) {
    return (
      <div className="container-page py-12">
        <EmptyState title="No payment found" message="We couldn't find a payment reference." action={<Link href="/orders" className="btn-primary">View my orders</Link>} />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verifies the payment with Paystack on the server, saves the order as paid and sends the email
  const result = await finalizeOrder(reference);

  if (result.state === 'not_found' || result.order.user_id !== user?.id) {
    return (
      <div className="container-page py-12">
        <EmptyState title="Order not found" message="We couldn't find this order on your account." action={<Link href="/orders" className="btn-primary">View my orders</Link>} />
      </div>
    );
  }

  const { order } = result;

  if (result.state === 'failed') {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          title="Payment not completed"
          message={`${result.reason} Your cart has been kept, so you can try again.`}
          action={<Link href="/cart" className="btn-primary">Back to cart</Link>}
        />
      </div>
    );
  }

  if (result.state === 'pending') {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="Payment not confirmed yet"
          message={`We haven't received confirmation for order ${order.order_number}. If you closed the payment page, your cart is still saved — just check out again. If you were charged, refresh in a minute.`}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`/checkout/success?reference=${encodeURIComponent(reference)}`} className="btn-outline">Refresh</Link>
              <Link href="/cart" className="btn-primary">Back to cart</Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <RefreshCart />
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">Thank you, {order.customer_name.split(' ')[0]}!</h1>
        <p className="mt-3 text-ink/60">
          Your payment was successful and order <strong className="text-ink">{order.order_number}</strong> is confirmed.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm text-ink/70">
          <Mail className="h-4 w-4 text-brand-700" /> A confirmation email is on its way to {order.customer_email}
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-ink/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold">Order details</h2>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-800">Paid</span>
        </div>
        <ul className="mt-5 divide-y divide-ink/5">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              {item.product_image && (
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  <Image src={item.product_image} alt={item.product_name} fill sizes="64px" className="object-cover object-[center_30%]" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-xs text-ink/55">
                  {[item.size && `Size ${item.size}`, item.color, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <p className="font-semibold">{formatNaira(item.line_total)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-ink/10 pt-4">
          <OrderTotals subtotal={order.subtotal} shipping={order.shipping_fee} />
        </div>
        <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Delivering to</p>
          <p className="mt-1">
            {order.customer_name} · {order.customer_phone}
            <br />
            {order.shipping_address}, {order.city}, {order.state}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/orders" className="btn-primary">View my orders</Link>
        <Link href="/#shop" className="btn-outline">Keep shopping</Link>
      </div>
    </div>
  );
}
