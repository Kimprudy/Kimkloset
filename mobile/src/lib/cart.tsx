import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/lib/types';

type CartValue = {
  /** null while loading; always [] when signed out */
  items: CartItem[] | null;
  error: string | null;
  count: number;
  subtotal: number;
  add: (item: { productId: string; size: string; color: string; quantity: number }) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartValue | null>(null);

type CartState = { userId: string; items: CartItem[] | null; error: string | null };

/**
 * The signed-in user's cart, read and changed through the website's /api/cart endpoints
 * (the same ones the website uses). Supabase Realtime tells us when it changes anywhere
 * (website, another phone, checkout) and we refetch.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<CartState | null>(null);
  const itemsRef = useRef<CartItem[]>([]);

  // Only the newest request may update the screen, so a slow older reply can't undo a newer change
  const latest = useRef(0);
  // Plain reload of the cart (used on sign-in, pull-to-refresh and live updates)
  const load = useCallback((forUser: string) => {
    const id = ++latest.current;
    return api<{ items: CartItem[] }>('/api/cart')
      .then(({ items }) => {
        if (id === latest.current) setState({ userId: forUser, items, error: null });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Could not load your cart.';
        if (id === latest.current) setState((s) => ({ userId: forUser, items: s?.userId === forUser ? s.items : null, error: message }));
      });
  }, []);

  // Add / change / remove: show the cart the server sends back. On failure, reload the real cart and report the error.
  const change = useCallback(
    async (forUser: string, request: () => Promise<{ items: CartItem[] }>) => {
      const id = ++latest.current;
      try {
        const { items } = await request();
        if (id === latest.current) setState({ userId: forUser, items, error: null });
      } catch (err) {
        void load(forUser);
        throw err;
      }
    },
    [load]
  );

  const refresh = useCallback(async () => {
    if (userId) await load(userId);
  }, [userId, load]);

  // Load the cart and listen for changes while signed in
  useEffect(() => {
    if (!userId) return;
    void load(userId);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(userId), 250);
    };
    const filter = `user_id=eq.${userId}`;
    const channel = supabase
      .channel(`cart-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cart_items', filter }, reload)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cart_items', filter }, reload)
      // Supabase can't filter delete events, so only react if the deleted row is one of ours
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'cart_items' }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (!id || itemsRef.current.some((i) => i.key === id)) reload();
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const add = useCallback<CartValue['add']>(
    async (item) => {
      // Read the user from the session so this also works straight after signing in
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) throw new Error('Please sign in first.');
      await change(uid, () => api('/api/cart', { method: 'POST', body: item }));
    },
    [change]
  );

  const updateQuantity = useCallback<CartValue['updateQuantity']>(
    async (key, quantity) => {
      if (!userId) return;
      await change(userId, () => api(`/api/cart/${encodeURIComponent(key)}`, { method: 'PATCH', body: { quantity } }));
    },
    [userId, change]
  );

  const remove = useCallback<CartValue['remove']>(
    async (key) => {
      if (!userId) return;
      await change(userId, () => api(`/api/cart/${encodeURIComponent(key)}`, { method: 'DELETE' }));
    },
    [userId, change]
  );

  const mine = state && state.userId === userId ? state : null;
  const items = useMemo(() => (userId ? (mine?.items ?? null) : []), [userId, mine]);
  const error = userId ? (mine?.error ?? null) : null;

  useEffect(() => {
    itemsRef.current = items ?? [];
  }, [items]);

  const value = useMemo<CartValue>(
    () => ({
      items,
      error,
      count: (items ?? []).reduce((n, i) => n + i.quantity, 0),
      subtotal: (items ?? []).reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      updateQuantity,
      remove,
      refresh,
    }),
    [items, error, add, updateQuantity, remove, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
