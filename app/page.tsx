import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import Instagram from '@/components/InstagramIcon';
import Catalog from '@/components/Catalog';
import EmptyState from '@/components/EmptyState';
import { getProducts } from '@/lib/products';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/config';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Which products appear in the hero and category tiles (by slug).
const HERO_MAIN = 'ivory-feather-cuff-cutout-dress';
const HERO_SIDE = ['black-plunge-backless-bodysuit', 'sage-satin-ruched-maxi-dress'];
const CATEGORY_COVERS: Record<string, string> = {
  Dresses: 'tangerine-floral-corset-mini-dress',
  Tops: 'olive-lace-up-crop-top',
  Sets: 'black-satin-corset-burgundy-sequin-skirt-set',
  Jumpsuits: 'grey-denim-corset-jumpsuit',
};

export default async function HomePage() {
  const { products, error } = await getProducts();
  const bySlug = (slug: string) => products.find((p) => p.slug === slug);

  const heroMain = bySlug(HERO_MAIN) ?? products[0];
  const heroSide = HERO_SIDE.map(bySlug).filter(Boolean) as Product[];

  const categories = Object.entries(CATEGORY_COVERS)
    .map(([name, slug]) => ({
      name,
      product: bySlug(slug) ?? products.find((p) => p.category === name),
      count: products.filter((p) => p.category === name).length,
    }))
    .filter((c) => c.product && c.count > 0);

  return (
    <>
      {/* HERO */}
      <section className="bg-white">
        <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-16">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> <span className="text-brand-700">The Kimkloset edit</span>
            </p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Made for
              <br />
              your <span className="italic text-brand-600">curves.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink/60 sm:text-lg">
              Dresses, crop tops, trousers, jeans, blazers, shapewear and more — pieces that fit and flatter,
              delivered anywhere in Nigeria.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#shop" className="btn-primary !py-3.5">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-outline !py-3.5">
                <Instagram className="h-4 w-4" /> {INSTAGRAM_HANDLE}
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 divide-x divide-ink/10 border-y border-ink/10 py-4 text-center">
              {[
                ['XS–XL', 'Every piece'],
                ['36 + FCT', 'States served'],
                ['2–5 days', 'Delivery'],
              ].map(([value, label]) => (
                <div key={label} className="px-2">
                  <dt className="text-lg font-bold">{value}</dt>
                  <dd className="text-xs text-ink/50">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {heroMain && (
            <div className="grid grid-cols-5 gap-3 sm:gap-4 lg:col-span-7">
              <Link
                href={`/products/${heroMain.slug}`}
                className="group relative col-span-3 aspect-[3/4] overflow-hidden rounded-xl bg-surface"
              >
                <Image
                  src={heroMain.image_url}
                  alt={heroMain.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 60vw, 40vw"
                  className="object-cover object-[center_30%] transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg bg-white/95 px-3 py-2 text-xs shadow-sm sm:text-sm">
                  <span className="truncate font-semibold">{heroMain.name}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </div>
              </Link>
              <div className="col-span-2 grid gap-3 sm:gap-4">
                {heroSide.map((p) => (
                  <Link key={p.id} href={`/products/${p.slug}`} className="group relative overflow-hidden rounded-xl bg-surface">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 40vw, 25vw"
                      className="object-cover object-[center_30%] transition duration-700 group-hover:scale-105"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PERKS */}
      <section className="border-y border-ink/5 bg-surface">
        <div className="container-page grid grid-cols-1 gap-4 py-5 text-sm sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Nationwide delivery', text: 'Flat fee to all 36 states + FCT' },
            { icon: ShieldCheck, title: 'Secure payment', text: 'Card, transfer or USSD via Paystack' },
            { icon: Sparkles, title: 'Curve-loving fits', text: 'Sizes XS to XL on every piece' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-ink" strokeWidth={1.75} />
              <p>
                <span className="font-semibold">{title}</span>
                <span className="text-ink/50"> · {text}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="container-page">
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" />}
            title="We couldn't load the shop"
            message="Please refresh the page. If this keeps happening, check that the Supabase keys in .env.local are correct and the SQL files have been run."
          />
        </div>
      ) : products.length === 0 ? (
        <div className="container-page">
          <EmptyState title="New pieces coming soon" message="The collection is being restocked. Check back shortly." />
        </div>
      ) : (
        <>
          {/* SHOP BY CATEGORY */}
          {categories.length > 0 && (
            <section className="container-page pt-16">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-3xl font-semibold sm:text-4xl">Shop by <span className="italic text-brand-600">category</span></h2>
                <Link href="#shop" className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:text-ink sm:flex">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {categories.map(({ name, product, count }) => (
                  <Link
                    key={name}
                    href={`/?category=${name}#shop`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-surface"
                  >
                    <Image
                      src={product!.image_url}
                      alt={name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-[center_30%] transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-white">
                      <div>
                        <p className="text-lg font-semibold sm:text-xl">{name}</p>
                        <p className="text-xs text-white/70">
                          {count} {count === 1 ? 'piece' : 'pieces'}
                        </p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-ink transition group-hover:translate-x-0.5">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CATALOG */}
          <Suspense fallback={<div className="container-page mt-16 h-96 skeleton" />}>
            <Catalog products={products} />
          </Suspense>
        </>
      )}

      {/* INSTAGRAM BAND */}
      <section className="container-page mt-20">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-ink px-8 py-12 text-center text-white sm:flex-row sm:px-12 sm:text-left">
          <div>
            <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/50 sm:justify-start">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {INSTAGRAM_HANDLE}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">See it styled on <span className="italic text-brand-400">Instagram</span></h2>
            <p className="mt-2 text-white/60">New drops, try-ons and restocks land on our page first.</p>
          </div>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn shrink-0 bg-brand-500 text-ink hover:bg-brand-400">
            <Instagram className="h-4 w-4" /> Follow us
          </a>
        </div>
      </section>
    </>
  );
}
