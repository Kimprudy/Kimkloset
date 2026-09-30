import { SHIPPING_FEE } from '@/lib/config';
import { formatNaira } from '@/lib/format';

export default function OrderTotals({ subtotal, shipping = SHIPPING_FEE }: { subtotal: number; shipping?: number }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink/60">Subtotal</dt>
        <dd className="font-medium">{formatNaira(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink/60">Delivery (flat rate)</dt>
        <dd className="font-medium">{formatNaira(shipping)}</dd>
      </div>
      <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
        <dt className="font-semibold">Total</dt>
        <dd className="font-bold">{formatNaira(subtotal + shipping)}</dd>
      </div>
    </dl>
  );
}
