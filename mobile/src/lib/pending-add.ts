// A signed-out shopper tapped "Add to cart": remember what they picked,
// send them to sign in, then add it once they're signed in (see app/sign-in.tsx).
export type PendingAdd = { productId: string; name: string; size: string; color: string; quantity: number };

let pending: PendingAdd | null = null;

export function setPendingAdd(item: PendingAdd | null) {
  pending = item;
}

/** Returns the waiting item (if any) and clears it so it's only added once. */
export function takePendingAdd() {
  const item = pending;
  pending = null;
  return item;
}
