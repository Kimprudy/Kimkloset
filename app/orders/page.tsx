import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Package } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { cn, formatDate, formatNaira } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'My orders' };
export const dynamic = 'force-dynamic';

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending: { label: 'Awaiting payment', className: 'bg-amber-100 text-amber-800' },
  failed: { label: 'Payment failed', className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'bg-ink/10 text-ink/70' },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/orders');

  // Row Level Security guarantees this only returns THIS user's orders
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  const orders = (data ?? []) as Order[];

  return (
    <div className="container-page max-w-4xl py-10 sm:py-12">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">My orders</h1>
      <p className="mt-1 text-sm text-ink/50">Every order you place is saved here.</p>

      {error ? (
        <EmptyState title="Couldn't load your orders" message="Please refresh the page and try again." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          message="When you place an order, it will show up here."
          action={<Link href="/#shop" className="btn-primary">Start shopping</Link>}
        />
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const status = STATUS[order.status] ?? STATUS.pending;
            return (
              <article key={order.id} className="overflow-hidden rounded-3xl border border-ink/5">
                <header className="flex flex-wrap items-center justify-between gap-3 bg-brand-50 px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-ink/50">Order</p>
                    <p className="font-bold">{order.order_number}</p>
                  </div>
                  <div className="text-sm text-ink/60">{formatDate(order.created_at)}</div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide', status.className)}>
                    {status.label}
                  </span>
                </header>
                <ul className="divide-y divide-ink/5 px-5">
                  {order.order_items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-3">
                      {item.product_image && (
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                          <Image src={item.product_image} alt={item.product_name} fill sizes="48px" className="object-cover object-[center_30%]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{item.product_name}</p>
                        <p className="text-xs text-ink/55">
                          {[item.size && `Size ${item.size}`, item.color, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatNaira(item.line_total)}</p>
                    </li>
                  ))}
                </ul>
                <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 px-5 py-4 text-sm">
                  <p className="text-ink/60">
                    Delivering to {order.city}, {order.state}
                  </p>
                  <p>
                    Total <span className="ml-1 text-base font-bold">{formatNaira(order.total)}</span>
                  </p>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
