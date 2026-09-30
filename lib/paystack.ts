import 'server-only';
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

type InitializeInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

/** Creates a Paystack payment page and returns the link to send the customer to. */
export async function initializeTransaction(input: InitializeInput) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo, // Paystack wants kobo: ₦1 = 100 kobo
      currency: 'NGN',
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) {
    throw new Error(json?.message || `Paystack initialize failed (${res.status})`);
  }
  return json.data as { authorization_url: string; access_code: string; reference: string };
}

export type PaystackTransaction = {
  status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'pending' | 'reversed' | string;
  reference: string;
  amount: number; // kobo
  currency: string;
  paid_at: string | null;
};

/** Asks Paystack directly whether a payment really succeeded. Never trust the browser for this. */
export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) {
    throw new Error(json?.message || `Paystack verify failed (${res.status})`);
  }
  return json.data as PaystackTransaction;
}

/** Confirms a webhook really came from Paystack. */
export function isValidPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = crypto.createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  const a = Buffer.from(hash);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
