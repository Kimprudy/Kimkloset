'use client';

import { useEffect } from 'react';
import { useCart } from '@/components/CartProvider';

/** After a successful payment the server empties the cart — this reloads it in the browser. */
export default function RefreshCart() {
  const { refresh } = useCart();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return null;
}
