'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import QuantityStepper from '@/components/QuantityStepper';
import { cn } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function AddToCartPanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(product.colors[0] ?? '');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  async function handleAdd() {
    if (product.sizes.length > 0 && !size) {
      setSizeError(true);
      return;
    }
    setAdding(true);
    try {
      await addItem(product, size ?? '', color, qty);
      setAdded(true);
      toast.success(`${product.name} added to your cart`);
    } catch (err) {
      console.error(err);
      toast.error('Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {product.colors.length > 0 && (
        <div>
          <p className="label">
            Colour: <span className="font-semibold text-ink">{color}</span>
          </p>
          {product.colors.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn('chip', color === c ? 'border-ink bg-ink text-white' : 'border-ink/15 hover:border-ink')}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {product.sizes.length > 0 && (
        <div>
          <p className="label">Size</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {product.sizes.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={size === s}
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                  setAdded(false);
                }}
                className={cn(
                  'chip !min-w-[3rem] !py-2.5 !text-sm',
                  size === s ? 'border-ink bg-ink text-white' : 'border-ink/15 hover:border-ink'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {sizeError && <p className="mt-2 text-sm font-medium text-red-600">Please choose a size.</p>}
        </div>
      )}

      <div>
        <p className="label">Quantity</p>
        <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={handleAdd} disabled={adding} className="btn-primary flex-1 !py-4">
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : added ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
          {adding ? 'Adding…' : added ? 'Added — add another' : 'Add to Cart'}
        </button>
        {added && (
          <Link href="/cart" className="btn-pink flex-1 !py-4">
            Go to cart
          </Link>
        )}
      </div>
    </div>
  );
}
