import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the Paystack webhook
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|products/|brand/|api/paystack/webhook).*)',
  ],
};
