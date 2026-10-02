import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getRequestUser } from '@/lib/auth';
import { fetchCart } from '@/lib/cart';
import { apiError, SIGN_IN_REQUIRED } from '@/lib/api';
import { MAX_QTY } from '@/lib/config';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

async function respondWithCart(supabase: SupabaseClient, userId: string) {
  try {
    return NextResponse.json({ items: await fetchCart(supabase, userId) });
  } catch (err) {
    console.error('[api/cart/id] reload failed', err);
    return apiError('Could not load your cart. Please try again.', 500);
  }
}

/** PATCH /api/cart/[id] — change quantity. Body: { quantity }. 0 removes the item. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase } = await getRequestUser(request);
  if (!user) return apiError(SIGN_IN_REQUIRED, 401);

  let quantity: number;
  try {
    quantity = Math.floor(Number((await request.json())?.quantity));
  } catch {
    return apiError('Invalid request.');
  }
  if (!Number.isFinite(quantity)) return apiError('Invalid request.');

  if (quantity < 1) {
    const { error } = await supabase.from('cart_items').delete().eq('id', id);
    if (error) return apiError('Could not update your cart. Please try again.', 500);
    return respondWithCart(supabase, user.id);
  }

  // RLS means this only finds the row if it belongs to this user
  const { data: row } = await supabase
    .from('cart_items')
    .select('id, products(name, stock)')
    .eq('id', id)
    .maybeSingle<{ id: string; products: { name: string; stock: number } | null }>();
  if (!row) return apiError('That item is no longer in your cart.', 404);

  const stock = row.products?.stock ?? 0;
  if (stock <= 0) return apiError(`${row.products?.name ?? 'This item'} is sold out.`, 409);

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: Math.min(MAX_QTY, stock, quantity), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[api/cart/id] update failed', error);
    return apiError('Could not update your cart. Please try again.', 500);
  }
  return respondWithCart(supabase, user.id);
}

/** DELETE /api/cart/[id] — remove an item. */
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase } = await getRequestUser(request);
  if (!user) return apiError(SIGN_IN_REQUIRED, 401);

  const { error } = await supabase.from('cart_items').delete().eq('id', id);
  if (error) {
    console.error('[api/cart/id] delete failed', error);
    return apiError('Could not update your cart. Please try again.', 500);
  }
  return respondWithCart(supabase, user.id);
}
