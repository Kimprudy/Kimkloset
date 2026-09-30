import Image from 'next/image';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith('/') && !sp.next.startsWith('//') ? sp.next : '/';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <div className="grid min-h-[calc(100vh-6.5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:block">
        <Image src="/products/sage-satin-ruched-maxi-dress.jpg" alt="" fill sizes="50vw" className="object-cover object-[center_30%] opacity-90 mix-blend-multiply" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-12 text-white">
          <p className="font-display text-4xl font-semibold">Your cart follows you.</p>
          <p className="mt-2 max-w-sm text-white/80">Sign in once and your cart and orders are saved to your account, on any device.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl font-semibold">Welcome to Kimkloset</h1>
          <p className="mt-2 text-sm text-ink/60">
            {next === '/checkout' ? 'Sign in to finish your order. Your cart is saved.' : 'Sign in or create an account to shop.'}
          </p>
          <div className="mt-8">
            <LoginForm next={next} initialError={sp.error ? 'Sign-in failed. Please try again.' : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
