import { NextResponse } from 'next/server';
import { isValidPaystackSignature } from '@/lib/paystack';
import { finalizeOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

/**
 * POST /api/paystack/webhook
 * Backup confirmation: Paystack calls this when a payment succeeds,
 * even if the customer closes the tab before returning to the site.
 * Set this URL in Paystack → Settings → API Keys & Webhooks (after deploying).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event?.event === 'charge.success' && event?.data?.reference) {
      await finalizeOrder(String(event.data.reference));
    }
  } catch (err) {
    console.error('[webhook] error', err);
  }

  // Always reply 200 so Paystack doesn't keep retrying
  return NextResponse.json({ received: true });
}
