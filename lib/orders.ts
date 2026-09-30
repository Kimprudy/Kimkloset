import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTransaction } from '@/lib/paystack';
import { sendEmail } from '@/lib/mailgun';
import { orderConfirmationEmail } from '@/lib/email-template';
import { siteUrl } from '@/lib/config';
import type { Order } from '@/lib/types';

export type FinalizeResult =
  | { state: 'paid'; order: Order }
  | { state: 'pending'; order: Order }
  | { state: 'failed'; order: Order; reason: string }
  | { state: 'not_found' };

const ORDER_SELECT = '*, order_items(*)';

export function generateOrderNumber() {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `KK-${date}-${random}`;
}

/**
 * The ONE place an order becomes "paid".
 * Called by the success page AND the Paystack webhook. Safe to call many times:
 * it only marks the order paid once, and only sends the email once.
 */
export async function finalizeOrder(reference: string): Promise<FinalizeResult> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select(ORDER_SELECT)
    .eq('payment_reference', reference)
    .maybeSingle<Order>();

  if (!order) return { state: 'not_found' };

  if (order.status === 'paid') {
    await ensureConfirmationEmail(order);
    return { state: 'paid', order };
  }

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    console.error('[finalizeOrder] verify failed', err);
    return { state: 'pending', order };
  }

  if (tx.status === 'success') {
    // Make sure the customer paid the right amount in the right currency
    if (tx.amount !== order.total * 100 || tx.currency !== order.currency) {
      console.error('[finalizeOrder] amount mismatch', { reference, paid: tx.amount, expected: order.total * 100 });
      return { state: 'failed', order, reason: 'The amount paid does not match this order. Please contact us.' };
    }

    const { data: updated } = await admin
      .from('orders')
      .update({ status: 'paid', paid_at: tx.paid_at ?? new Date().toISOString() })
      .eq('id', order.id)
      .in('status', ['pending', 'failed'])
      .select(ORDER_SELECT)
      .maybeSingle<Order>();

    if (updated) {
      // First time we've seen this payment: empty the customer's cart
      await admin.from('cart_items').delete().eq('user_id', order.user_id);
    }

    const paidOrder = updated ?? { ...order, status: 'paid' as const };
    await ensureConfirmationEmail(paidOrder);
    return { state: 'paid', order: paidOrder };
  }

  if (tx.status === 'failed') {
    await admin.from('orders').update({ status: 'failed' }).eq('id', order.id).eq('status', 'pending');
    return { state: 'failed', order: { ...order, status: 'failed' }, reason: 'Your payment was declined.' };
  }

  // abandoned / ongoing / pending
  return { state: 'pending', order };
}

/** Sends the confirmation email exactly once per order. */
async function ensureConfirmationEmail(order: Order) {
  if (order.email_sent_at) return;
  const admin = createAdminClient();

  // "Claim" the email so the webhook and the success page can't both send it
  const { data: claimed } = await admin
    .from('orders')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', order.id)
    .is('email_sent_at', null)
    .select('id')
    .maybeSingle();

  if (!claimed) return;

  try {
    const email = orderConfirmationEmail(order, siteUrl());
    await sendEmail({ to: order.customer_email, ...email });
  } catch (err) {
    console.error('[email] confirmation failed', err);
    // Release the claim so it can be retried next time
    await admin.from('orders').update({ email_sent_at: null }).eq('id', order.id);
  }
}
