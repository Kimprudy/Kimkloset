import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import AddToCartPanel from '@/components/AddToCartPanel';
import { getProductBySlug } from '@/lib/products';
import { formatNaira } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Not found' };
  return { title: product.name, description: product.description, openGraph: { images: [product.image_url] } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="container-page py-8 sm:py-12">
      <Link href="/#shop" className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-brand-50 lg:aspect-[4/5]">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[center_25%]"
          />
        </div>

        <div className="lg:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">{product.category}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-2xl font-bold">{formatNaira(product.price)}</p>
          <p className="mt-5 leading-relaxed text-ink/70">{product.description}</p>

          <AddToCartPanel product={product} />

          <ul className="mt-10 space-y-3 border-t border-ink/5 pt-6 text-sm text-ink/70">
            <li className="flex items-center gap-3"><Truck className="h-4 w-4 text-brand-700" /> Delivery across Nigeria in 2–5 working days</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand-700" /> Secure checkout with Paystack</li>
            <li className="flex items-center gap-3"><RotateCcw className="h-4 w-4 text-brand-700" /> Wrong size? Message us within 48 hours of delivery</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
