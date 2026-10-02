import { NextResponse } from 'next/server';
import { finalizeOrder } from '@/lib/orders';
import { isAllowedReturnUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/checkout/mobile-return?to=<app deep link>&reference=KK-...
 * Paystack sends the customer here after paying in the mobile app's browser sheet.
 * We confirm the payment on the server (in case they never come back), then open the app.
 * The app then calls /api/orders/verify to show the result, so nothing private is put in the link.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const to = params.get('to');
  // Paystack adds its own ?trxref=&reference= — take our first one and drop anything it glued on
  const reference = (params.get('reference') || params.get('trxref') || '').split('?')[0].trim();

  if (!isAllowedReturnUrl(to)) {
    return new NextResponse('Invalid return link.', { status: 400 });
  }

  if (reference) {
    try {
      await finalizeOrder(reference);
    } catch (err) {
      console.error('[mobile-return] finalize failed', err);
    }
  }

  const appUrl = `${to}${to.includes('?') ? '&' : '?'}reference=${encodeURIComponent(reference)}`;
  return NextResponse.redirect(appUrl, 302);
}
