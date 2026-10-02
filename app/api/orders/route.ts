import { NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { apiError, SIGN_IN_REQUIRED } from '@/lib/api';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/orders — the signed-in user's orders, newest first, with their items. */
export async function GET(request: Request) {
  const { user, supabase } = await getRequestUser(request);
  if (!user) return apiError(SIGN_IN_REQUIRED, 401);

  // Row Level Security guarantees this only returns THIS user's orders
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[api/orders]', error);
    return apiError('Could not load your orders. Please try again.', 500);
  }
  return NextResponse.json({ orders: (data ?? []) as Order[] });
}
