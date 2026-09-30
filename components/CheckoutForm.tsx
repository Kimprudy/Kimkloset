'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import EmptyState from '@/components/EmptyState';
import OrderTotals from '@/components/OrderTotals';
import { NIGERIAN_STATES, SHIPPING_FEE } from '@/lib/config';
import { formatNaira } from '@/lib/format';

type Defaults = { fullName: string; phone: string; email: string };

export default function CheckoutForm({ defaults }: { defaults: Defaults }) {
  const { items, subtotal, loading } = useCart();
  const [form, setForm] = useState({
    fullName: defaults.fullName,
    phone: defaults.phone,
    address: '',
    city: '',
    state: 'Lagos',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  function validate() {
    const e: typeof errors = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Enter your full name';
    if (!/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    if (form.address.trim().length < 5) e.address = 'Enter your delivery address';
    if (form.city.trim().length < 2) e.city = 'Enter your city';
    if (!form.state) e.state = 'Choose your state';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.authorizationUrl) throw new Error(json.error || 'Could not start payment.');
      toast.success('Redirecting you to Paystack…');
      window.location.href = json.authorizationUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start payment.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="skeleton h-96" />
        <div className="skeleton h-80" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out"
        message="Your cart is empty. Add a piece first."
        action={<Link href="/#shop" className="btn-primary">Browse the shop</Link>}
      />
    );
  }

  const field = (name: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} className="input" value={form[name]} onChange={set(name)} aria-invalid={!!errors[name]} {...props} />
      {errors[name] && <p className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handlePay} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="space-y-8">
        <section className="rounded-3xl border border-ink/5 p-6">
          <h2 className="font-display text-2xl font-semibold">Contact</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {field('fullName', 'Full name', { autoComplete: 'name' })}
            {field('phone', 'Phone number', { autoComplete: 'tel', inputMode: 'tel', placeholder: '0803 000 0000' })}
            <div className="sm:col-span-2">
              <label className="label">Email (for your receipt)</label>
              <input className="input bg-brand-50/50" value={defaults.email} readOnly />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-ink/5 p-6">
          <h2 className="font-display text-2xl font-semibold">Delivery address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {field('address', 'Street address', { autoComplete: 'street-address', placeholder: '12 Admiralty Way, Lekki Phase 1' })}
            </div>
            {field('city', 'City', { autoComplete: 'address-level2', placeholder: 'Lekki' })}
            <div>
              <label htmlFor="state" className="label">State</label>
              <select id="state" className="input" value={form.state} onChange={set('state')}>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-xs font-medium text-red-600">{errors.state}</p>}
            </div>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-3xl bg-brand-50 p-6 lg:sticky lg:top-32">
        <h2 className="font-display text-2xl font-semibold">Review your order</h2>
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.key} className="flex gap-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image src={item.image_url} alt={item.name} fill sizes="64px" className="object-cover object-[center_30%]" />
                <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center rounded-bl-lg bg-ink px-1 text-[10px] font-bold text-white">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{item.name}</p>
                <p className="text-xs text-ink/55">{[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ')}</p>
              </div>
              <p className="text-sm font-semibold">{formatNaira(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 border-t border-ink/10 pt-5">
          <OrderTotals subtotal={subtotal} />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full !py-4">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {submitting ? 'Starting payment…' : `Pay ${formatNaira(subtotal + SHIPPING_FEE)} with Paystack`}
        </button>
        <p className="mt-3 text-center text-xs text-ink/50">
          You&apos;ll be taken to Paystack&apos;s secure page to pay by card, bank transfer or USSD.
        </p>
        <Link href="/cart" className="mt-4 block text-center text-sm font-medium text-ink/60 hover:text-ink">
          Edit cart
        </Link>
      </aside>
    </form>
  );
}
