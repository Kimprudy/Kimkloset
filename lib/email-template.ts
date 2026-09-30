import { formatNaira } from '@/lib/format';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/config';
import type { Order } from '@/lib/types';

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function orderConfirmationEmail(order: Order, siteUrl: string) {
  const firstName = order.customer_name.split(' ')[0] || order.customer_name;
  const statusLabel = order.status === 'paid' ? 'Paid' : order.status;

  const rows = order.order_items
    .map((item) => {
      const options = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ');
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3e1ef;">
            <div style="font-weight:600;color:#111;">${esc(item.product_name)}</div>
            <div style="font-size:13px;color:#777;">${esc(options)}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f3e1ef;text-align:center;color:#111;">${item.quantity}</td>
          <td style="padding:12px 0;border-bottom:1px solid #f3e1ef;text-align:right;color:#111;">${formatNaira(item.line_total)}</td>
        </tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#fdf2fb;font-family:Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2fb;padding:24px 12px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#F86EDE,#FAB5ED 55%,#FDFCFD);background-color:#F86EDE;padding:32px 28px;text-align:center;">
              <div style="font-size:28px;font-weight:800;letter-spacing:2px;color:#111;">KIMKLOSET</div>
              <div style="font-size:12px;letter-spacing:3px;color:#111;margin-top:4px;">ONLINE FASHION STORE</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#111;">Thank you, ${esc(firstName)}! 💕</h1>
              <p style="margin:0 0 20px;color:#444;line-height:1.5;">
                We've received your order and your payment was successful. Here are your order details.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5fd;border-radius:12px;padding:16px;margin-bottom:20px;">
                <tr><td style="padding:4px 16px;color:#777;font-size:13px;">Order number</td><td style="padding:4px 16px;text-align:right;font-weight:700;color:#111;">${esc(order.order_number)}</td></tr>
                <tr><td style="padding:4px 16px;color:#777;font-size:13px;">Customer</td><td style="padding:4px 16px;text-align:right;color:#111;">${esc(order.customer_name)}</td></tr>
                <tr><td style="padding:4px 16px;color:#777;font-size:13px;">Payment status</td><td style="padding:4px 16px;text-align:right;"><span style="background:#dcfce7;color:#166534;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;">${esc(statusLabel)}</span></td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th align="left" style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Item</th>
                  <th style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Qty</th>
                  <th align="right" style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px;">Amount</th>
                </tr>
                ${rows}
                <tr><td colspan="2" style="padding:10px 0 2px;color:#777;">Subtotal</td><td style="padding:10px 0 2px;text-align:right;color:#111;">${formatNaira(order.subtotal)}</td></tr>
                <tr><td colspan="2" style="padding:2px 0;color:#777;">Delivery</td><td style="padding:2px 0;text-align:right;color:#111;">${formatNaira(order.shipping_fee)}</td></tr>
                <tr><td colspan="2" style="padding:10px 0;font-weight:700;font-size:17px;color:#111;">Total paid</td><td style="padding:10px 0;text-align:right;font-weight:700;font-size:17px;color:#111;">${formatNaira(order.total)}</td></tr>
              </table>

              <div style="margin-top:20px;padding:16px;border:1px solid #f3e1ef;border-radius:12px;">
                <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Delivering to</div>
                <div style="color:#111;line-height:1.5;">
                  ${esc(order.customer_name)}<br/>
                  ${esc(order.shipping_address)}<br/>
                  ${esc(order.city)}, ${esc(order.state)}<br/>
                  ${esc(order.customer_phone)}
                </div>
              </div>

              <div style="text-align:center;margin-top:28px;">
                <a href="${siteUrl}/orders" style="background:#111;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;display:inline-block;">View my orders</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#fff5fd;text-align:center;font-size:12px;color:#888;">
              Questions? Reply to this email or DM us on Instagram
              <a href="${INSTAGRAM_URL}" style="color:#B8339F;">${INSTAGRAM_HANDLE}</a>.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `Thank you, ${firstName}!`,
    `Your Kimkloset order ${order.order_number} is confirmed.`,
    `Payment status: ${statusLabel}`,
    '',
    ...order.order_items.map(
      (i) => `- ${i.product_name}${i.size ? ` (Size ${i.size})` : ''} x${i.quantity} — ${formatNaira(i.line_total)}`
    ),
    '',
    `Subtotal: ${formatNaira(order.subtotal)}`,
    `Delivery: ${formatNaira(order.shipping_fee)}`,
    `Total paid: ${formatNaira(order.total)}`,
    '',
    `Delivering to: ${order.shipping_address}, ${order.city}, ${order.state}`,
    `View your orders: ${siteUrl}/orders`,
  ].join('\n');

  return {
    subject: `Your Kimkloset order ${order.order_number} is confirmed`,
    html,
    text,
  };
}
