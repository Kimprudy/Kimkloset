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

type DbCartRow = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  products: { slug: string; name: string; price: number; image_url: string; is_active: boolean; stock: number } | null;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;
  const initialised = useRef(false);

  // ---------- signed-in cart (Supabase) ----------
  const fetchDbCart = useCallback(
    async (userId: string): Promise<CartItem[]> => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('id, product_id, size, color, quantity, products(slug, name, price, image_url, is_active, stock)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .returns<DbCartRow[]>();
      if (error) throw error;
      return (data ?? [])
        .filter((r) => r.products && r.products.is_active)
        .map((r) => ({
          key: r.id,
          product_id: r.product_id,
          slug: r.products!.slug,
          name: r.products!.name,
          price: r.products!.price,
          image_url: r.products!.image_url,
          size: r.size,
          color: r.color,
          quantity: r.quantity,
          stock: r.products!.stock,
        }));
    },
    [supabase]
  );

  // When a guest signs in, move their browser cart into their account
  const mergeGuestCart = useCallback(
    async (userId: string) => {
      const guestItems = readLocal();
      if (guestItems.length === 0) return;
      writeLocal([]); // clear first so a second auth event can't merge twice

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, product_id, size, color, quantity')
        .eq('user_id', userId);

      for (const g of guestItems) {
        const match = existing?.find(
          (e) => e.product_id === g.product_id && e.size === g.size && e.color === g.color
        );
        if (match) {
          await supabase
            .from('cart_items')
            .update({ quantity: Math.min(MAX_QTY, match.quantity + g.quantity), updated_at: new Date().toISOString() })
            .eq('id', match.id);
        } else {
          await supabase.from('cart_items').insert({
            user_id: userId,
            product_id: g.product_id,
            size: g.size,
            color: g.color,
            quantity: Math.min(MAX_QTY, g.quantity),
          });
        }
      }
    },
    [supabase]
  );

  const loadFor = useCallback(
    async (u: User | null) => {
      setLoading(true);
      try {
        if (u) {
          await mergeGuestCart(u.id);
          setItems(await fetchDbCart(u.id));
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

      const { data: existing, error: findError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', u.id)
        .eq('product_id', product.id)
        .eq('size', size)
        .eq('color', color)
        .maybeSingle();
      if (findError) throw findError;

      const { error } = existing
        ? await supabase
            .from('cart_items')
            .update({ quantity: Math.min(cap, existing.quantity + quantity), updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        : await supabase
            .from('cart_items')
            .insert({ user_id: u.id, product_id: product.id, size, color, quantity: Math.min(cap, quantity) });
      if (error) throw error;

      setItems(await fetchDbCart(u.id));
    },
    [supabase, fetchDbCart]
  );

  const removeItem = useCallback(
    async (key: string) => {
      const u = userRef.current;
      setItems((prev) => prev.filter((i) => i.key !== key)); // instant UI
      if (!u) {
        writeLocal(readLocal().filter((i) => i.key !== key));
        return;
      }
      const { error } = await supabase.from('cart_items').delete().eq('id', key);
      if (error) {
        setItems(await fetchDbCart(u.id));
        throw error;
      }
    },
    [supabase, fetchDbCart]
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
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('id', key);
      if (error) {
        setItems(await fetchDbCart(u.id));
        throw error;
      }
    },
    [supabase, fetchDbCart, removeItem]
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
