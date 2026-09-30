import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { siteUrl } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Kimkloset — Online Fashion Store',
    template: '%s · Kimkloset',
  },
  description: 'Kimkloset is an online fashion store for women. Dresses, tops, crop tops, trousers, jeans, outerwear and shapewear, delivered across Nigeria.',
  openGraph: {
    title: 'Kimkloset — Online Fashion Store',
    description: 'Dresses, tops, trousers, jeans and shapewear for women. Delivered across Nigeria.',
    images: ['/brand/logo-full.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#F86EDE',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </body>
    </html>
  );
}
