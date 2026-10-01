'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, Package, ShoppingBag, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import HangerIcon from '@/components/HangerIcon';

export default function Header() {
  const { count, user, signOut } = useCart();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    toast.success('You have been signed out.');
    router.push('/');
    router.refresh();
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink py-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white">
        Delivery across Nigeria<span className="hidden sm:inline"> · Secure checkout with Paystack</span>
      </div>
      <div className="border-b border-ink/5 bg-white/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Kimkloset home" className="flex shrink-0 items-center gap-1.5">
            <HangerIcon className="h-4 w-auto text-ink sm:h-[18px]" />
            <Image src="/brand/wordmark.png" alt="Kimkloset" width={447} height={62} priority className="h-5 w-auto sm:h-6" />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-brand-700 lg:flex">
            <Link href="/#shop" className="transition hover:text-ink">Shop</Link>
            <Link href="/?category=Dresses#shop" className="transition hover:text-ink">Dresses</Link>
            <Link href="/?category=Tops#shop" className="transition hover:text-ink">Tops</Link>
            <Link href="/?category=Sets#shop" className="transition hover:text-ink">Sets</Link>
            <Link href="/?category=Jumpsuits#shop" className="transition hover:text-ink">Jumpsuits</Link>
            <Link href="/?category=Shapewear#shop" className="transition hover:text-ink">Shapewear</Link>
          </nav>

          <div className="flex items-center gap-1">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                >
                  <UserIcon className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-xl">
                    <div className="border-b border-ink/5 px-4 py-3">
                      <p className="text-xs text-ink/50">Signed in as</p>
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                    </div>
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-black/5"
                    >
                      <Package className="h-4 w-4" /> My orders
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-black/5"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-black/5">
                Sign in
              </Link>
            )}

            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-ink">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
