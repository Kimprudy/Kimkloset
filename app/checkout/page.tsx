import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import CheckoutForm from '@/components/CheckoutForm';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Checkout' };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/checkout');

  const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();

  const fullName =
    profile?.full_name ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    '';

  return (
    <div className="container-page py-10 sm:py-12">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Checkout</h1>
      <p className="mt-1 text-sm text-ink/50">Check your items, tell us where to deliver, then pay securely.</p>
      <CheckoutForm defaults={{ fullName, phone: profile?.phone ?? '', email: user.email ?? '' }} />
    </div>
  );
}
