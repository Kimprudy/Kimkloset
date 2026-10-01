'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import EmptyState from '@/components/EmptyState';
import OrderTotals from '@/components/OrderTotals';
import QuantityStepper from '@/components/QuantityStepper';
import { formatNaira } from '@/lib/format';
import { LOW_STOCK } from '@/lib/config';

export default function CartPage() {
  const { items, subtotal, count, loading, user, updateQuantity, removeItem } = useCart();

  async function safely(fn: () => Promise<void>) {
    try {
      await fn();
    } catch {
      toast.error('Something went wrong updating your cart. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="container-page py-12">
        <div className="skeleton h-10 w-48" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-32" />
            ))}
          </div>
          <div className="skeleton h-64" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title="Your cart is empty"
          message="Browse the collection and add a piece you love."
          action={<Link href="/#shop" className="btn-primary">Start shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-12">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Your cart</h1>
      <p className="mt-1 text-sm text-ink/50">
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-ink/5 rounded-3xl border border-ink/5 bg-white">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/products/${item.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:h-32 sm:w-28">
                <Image src={item.image_url} alt={item.name} fill sizes="112px" className="object-cover object-[center_30%]" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="font-semibold leading-snug hover:text-brand-700">
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1 text-sm text-ink/60">{formatNaira(item.price)} each</p>
                    {item.stock !== undefined && item.stock <= 0 ? (
                      <p className="mt-1 text-xs font-semibold text-red-600">Sold out — please remove this item</p>
                    ) : item.stock !== undefined && item.quantity > item.stock ? (
                      <p className="mt-1 text-xs font-semibold text-red-600">Only {item.stock} left — please reduce the quantity</p>
                    ) : item.stock !== undefined && item.stock <= LOW_STOCK ? (
                      <p className="mt-1 text-xs font-semibold text-brand-700">Only {item.stock} left</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-bold">{formatNaira(item.price * item.quantity)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityStepper
                    size="sm"
                    max={item.stock}
                    value={item.quantity}
                    onChange={(n) => safely(() => updateQuantity(item.key, n))}
                  />
                  <button
                    onClick={() =>
                      safely(async () => {
                        await removeItem(item.key);
                        toast.success(`${item.name} removed`);
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-ink/55 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-brand-50 p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-2xl font-semibold">Order summary</h2>
          <div className="mt-5">
            <OrderTotals subtotal={subtotal} />
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full !py-4">
            <Lock className="h-4 w-4" /> Proceed to checkout
          </Link>
          {!user && (
            <p className="mt-3 text-center text-xs text-ink/55">
              You&apos;ll sign in before paying. Your cart will be saved to your account.
            </p>
          )}
          <Link href="/#shop" className="mt-4 block text-center text-sm font-medium text-ink/60 hover:text-ink">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
