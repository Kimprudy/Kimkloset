'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { MAX_QTY } from '@/lib/config';
import type { CartItem, Product } from '@/lib/types';

const LOCAL_KEY = 'kimkloset_cart_v1';

type CartContextValue = {
  user: User | null;
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  addItem: (product: Product, size: string, color: string, quantity?: number) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

// ---------- guest cart (browser storage) ----------
function readLocal(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeLocal(items: CartItem[]) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable (private mode) — cart still works for this visit */
  }
}
const localKey = (productId: string, size: string, color: string) => `${productId}|${size}|${color}`;

// ---------- signed-in cart (shared /api/cart endpoints, same as the mobile app) ----------
async function cartRequest(path: string, method = 'GET', body?: unknown): Promise<CartItem[]> {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Cart request failed (${res.status})`);
  return json.items as CartItem[];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;
  const initialised = useRef(false);

  const fetchDbCart = useCallback(() => cartRequest('/api/cart'), []);

  // When a guest signs in, move their browser cart into their account
  // (POST adds to any matching line and caps at stock / MAX_QTY)
  const mergeGuestCart = useCallback(async () => {
    const guestItems = readLocal();
    if (guestItems.length === 0) return;
    writeLocal([]); // clear first so a second auth event can't merge twice

    for (const g of guestItems) {
      try {
        await cartRequest('/api/cart', 'POST', { productId: g.product_id, size: g.size, color: g.color, quantity: g.quantity });
      } catch (err) {
        console.warn('[cart] could not merge', g.name, err); // e.g. sold out since it was added
      }
    }
  }, []);

  const loadFor = useCallback(
    async (u: User | null) => {
      setLoading(true);
      try {
        if (u) {
          await mergeGuestCart();
          setItems(await fetchDbCart());
        } else {
          setItems(readLocal());
        }
      } catch (err) {
        console.error('[cart] load failed', err);
      } finally {
        setLoading(false);
      }
    },
    [fetchDbCart, mergeGuestCart]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      // Ignore token refreshes for the same user
      if (initialised.current && next?.id === userRef.current?.id) {
        userRef.current = next;
        setUser(next);
        return;
      }
      initialised.current = true;
      userRef.current = next;
      setUser(next);
      // Run outside the auth callback (Supabase recommends not awaiting inside it)
      setTimeout(() => void loadFor(next), 0);
    });
    return () => subscription.unsubscribe();
  }, [supabase, loadFor]);

  const refresh = useCallback(async () => {
    await loadFor(userRef.current);
  }, [loadFor]);

  // Live sync: when this user's cart changes anywhere (another tab, the mobile app, checkout),
  // refetch it. We don't build state from the event itself because delete events only carry the id.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fetchDbCart()
          .then((next) => {
            if (userRef.current?.id === userId) setItems(next);
          })
          .catch((err) => console.error('[cart] live refresh failed', err));
      }, 250);
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
  }, [supabase, userId, fetchDbCart]);

  const addItem = useCallback(
    async (product: Product, size: string, color: string, quantity = 1) => {
      const u = userRef.current;
      if (product.stock <= 0) throw new Error('SOLD_OUT');
      const cap = Math.min(MAX_QTY, product.stock);

      if (!u) {
        const current = readLocal();
        const key = localKey(product.id, size, color);
        const found = current.find((i) => i.key === key);
        const next = found
          ? current.map((i) => (i.key === key ? { ...i, quantity: Math.min(cap, i.quantity + quantity), stock: product.stock } : i))
          : [
              ...current,
              {
                key,
                product_id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                size,
                color,
                quantity: Math.min(cap, quantity),
                stock: product.stock,
              },
            ];
        writeLocal(next);
        setItems(next);
        return;
      }

      setItems(await cartRequest('/api/cart', 'POST', { productId: product.id, size, color, quantity }));
    },
    []
  );

  const removeItem = useCallback(
    async (key: string) => {
      const u = userRef.current;
      setItems((prev) => prev.filter((i) => i.key !== key)); // instant UI
      if (!u) {
        writeLocal(readLocal().filter((i) => i.key !== key));
        return;
      }
      try {
        setItems(await cartRequest(`/api/cart/${encodeURIComponent(key)}`, 'DELETE'));
      } catch (err) {
        setItems(await fetchDbCart());
        throw err;
      }
    },
    [fetchDbCart]
  );

  const updateQuantity = useCallback(
    async (key: string, quantity: number) => {
      if (quantity < 1) return removeItem(key);
      const known = itemsRef.current.find((i) => i.key === key)?.stock;
      const qty = Math.min(MAX_QTY, known ?? MAX_QTY, quantity);
      const u = userRef.current;
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: qty } : i)));
      if (!u) {
        writeLocal(readLocal().map((i) => (i.key === key ? { ...i, quantity: qty } : i)));
        return;
      }
      try {
        setItems(await cartRequest(`/api/cart/${encodeURIComponent(key)}`, 'PATCH', { quantity: qty }));
      } catch (err) {
        setItems(await fetchDbCart());
        throw err;
      }
    },
    [fetchDbCart, removeItem]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<CartContextValue>(
    () => ({
      user,
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      loading,
      addItem,
      updateQuantity,
      removeItem,
      refresh,
      signOut,
    }),
    [user, items, loading, addItem, updateQuantity, removeItem, refresh, signOut]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
