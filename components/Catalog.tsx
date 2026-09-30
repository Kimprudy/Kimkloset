'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { CATEGORIES } from '@/lib/config';
import { cn } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function Catalog({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const category = params.get('category') ?? 'All';
  const [query, setQuery] = useState('');

  function setCategory(c: string) {
    const next = new URLSearchParams(params.toString());
    if (c === 'All') next.delete('category');
    else next.set('category', c);
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}#shop`, { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const inCategory = category === 'All' || p.category === category;
      const matches =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.colors.some((c) => c.toLowerCase().includes(q));
      return inCategory && matches;
    });
  }, [products, category, query]);

  // Known categories first (only if they have products), then any new category added in Supabase
  const tabs = [
    'All',
    ...Array.from(
      new Set([...CATEGORIES.filter((c) => products.some((p) => p.category === c)), ...products.map((p) => p.category)])
    ),
  ];

  return (
    <section id="shop" className="container-page scroll-mt-28 pt-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink/60"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> The collection</p>
          <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">All <span className="italic text-brand-600">pieces</span></h2>
        </div>
        <p className="text-sm text-ink/50">
          {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setCategory(t)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
                category === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink/10 bg-white hover:border-brand-600 hover:text-brand-700'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:w-80">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, satin, black…"
            className="input !rounded-full !pl-11 !pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/40 hover:bg-black/5 hover:text-ink"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No pieces found"
          message={query ? `Nothing matches “${query}”. Try another word or category.` : 'Nothing in this category yet.'}
          action={
            <button
              className="btn-outline"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Show everything
            </button>
          }
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </section>
  );
}
