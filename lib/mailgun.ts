import 'server-only';

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Sends an email through the Mailgun HTTP API. */
export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY or MAILGUN_DOMAIN is not set');

  const base = (process.env.MAILGUN_API_BASE || 'https://api.mailgun.net').replace(/\/$/, '');
  const from = process.env.MAILGUN_FROM || `Kimkloset <postmaster@${domain}>`;

  const body = new URLSearchParams({ from, to, subject, html, text });

  const res = await fetch(`${base}/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
    },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Mailgun error ${res.status}: ${detail}`);
  }
}
