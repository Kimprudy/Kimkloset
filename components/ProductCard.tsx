'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import { cn, formatNaira } from '@/lib/format';
import { LOW_STOCK } from '@/lib/config';
import type { Product } from '@/lib/types';

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart();
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [adding, setAdding] = useState(false);
  const [needsSize, setNeedsSize] = useState(false);
  const color = product.colors[0] ?? '';
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= LOW_STOCK;

  async function handleAdd() {
    if (product.sizes.length > 0 && !size) {
      setNeedsSize(true);
      toast.error('Please choose a size first.');
      return;
    }
    setAdding(true);
    try {
      await addItem(product, size ?? '', color, 1);
      toast.success(`${product.name} added to your cart`, {
        action: { label: 'View cart', onClick: () => (window.location.href = '/cart') },
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error && err.message === 'SOLD_OUT' ? 'Sorry, this piece is sold out.' : 'Could not add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-xl bg-surface"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={cn(
            'object-cover object-[center_30%] transition duration-500 group-hover:scale-[1.04]',
            soldOut && 'opacity-50 grayscale'
          )}
        />
        {soldOut && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
        {lowStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
            Only {product.stock} left
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
          {product.category}
        </span>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <Link href={`/products/${product.slug}`} className="text-sm font-semibold leading-snug hover:text-ink/60 sm:text-base">
            {product.name}
          </Link>
          <p className="shrink-0 text-sm font-bold sm:text-base">{formatNaira(product.price)}</p>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-ink/60 sm:text-sm">{product.description}</p>
        {color && (
          <p className="mt-1.5 text-xs text-ink/50">
            Colour: <span className="font-medium text-ink/80">{color}</span>
          </p>
        )}

        {product.sizes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1 sm:gap-1.5" role="radiogroup" aria-label={`Size for ${product.name}`}>
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                onClick={() => {
                  setSize(s);
                  setNeedsSize(false);
                }}
                className={cn(
                  'chip !min-w-[1.85rem] !px-1.5 !py-1 sm:!min-w-[2.1rem] sm:!px-2',
                  size === s
                    ? 'border-ink bg-ink text-white'
                    : needsSize
                      ? 'border-red-400 text-ink'
                      : 'border-ink/15 text-ink/70 hover:border-ink'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <button onClick={handleAdd} disabled={adding || soldOut} className="btn-primary mt-3 w-full !py-2.5">
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
          {soldOut ? 'Sold out' : adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
