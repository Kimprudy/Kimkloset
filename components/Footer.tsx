import Image from 'next/image';
import Link from 'next/link';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/config';
import HangerIcon from '@/components/HangerIcon';

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5">
            <HangerIcon className="h-4 w-auto text-white" />
            <Image src="/brand/wordmark-white.png" alt="Kimkloset" width={447} height={62} className="h-5 w-auto" />
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/60">
            Pieces that hug every curve. An online fashion store for women, based in Nigeria.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li><Link href="/?category=Dresses#shop" className="hover:text-white">Dresses</Link></li>
            <li><Link href="/?category=Tops#shop" className="hover:text-white">Tops</Link></li>
            <li><Link href="/?category=Sets#shop" className="hover:text-white">Sets</Link></li>
            <li><Link href="/?category=Jumpsuits#shop" className="hover:text-white">Jumpsuits</Link></li>
            <li><Link href="/?category=Outerwear#shop" className="hover:text-white">Outerwear</Link></li>
            <li><Link href="/?category=Shapewear#shop" className="hover:text-white">Shapewear</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Say hello</h3>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="hover:text-white">
                Instagram {INSTAGRAM_HANDLE}
              </a>
            </li>
            <li><Link href="/orders" className="hover:text-white">Track my orders</Link></li>
            <li><Link href="/cart" className="hover:text-white">My cart</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Kimkloset. All rights reserved.
      </div>
    </footer>
  );
}
