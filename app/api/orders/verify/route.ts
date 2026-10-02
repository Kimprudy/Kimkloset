import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { finalizeOrder } from '@/lib/orders';
import { apiError, SIGN_IN_REQUIRED } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/verify?reference=KK-...
 * Used by the mobile app after Paystack. Confirms the payment (same logic as the web success page)
 * and returns the order. Only the order's owner gets an answer.
 */
export async function GET(request: Request) {
  const { user, supabase } = await getRequestUser(request);
  if (!user) return apiError(SIGN_IN_REQUIRED, 401);

  const reference = new URL(request.url).searchParams.get('reference')?.trim();
  if (!reference) return apiError('Missing payment reference.');

  // RLS: this only finds the order if it belongs to the caller
  const { data: owned } = await supabase.from('orders').select('id').eq('payment_reference', reference).maybeSingle();
  if (!owned) return apiError("We couldn't find this order on your account.", 404);

  const result = await finalizeOrder(reference);
  if (result.state === 'not_found' || result.order.user_id !== user.id) {
    return apiError("We couldn't find this order on your account.", 404);
  }

  return NextResponse.json({
    state: result.state,
    order: result.order,
    reason: result.state === 'failed' ? result.reason : undefined,
  });
}
