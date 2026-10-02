import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartItem } from '@/lib/types';

type DbCartRow = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  products: { slug: string; name: string; price: number; image_url: string; is_active: boolean; stock: number } | null;
};

/** Reads a signed-in user's cart (same shape the web CartProvider uses). */
export async function fetchCart(supabase: SupabaseClient, userId: string): Promise<CartItem[]> {
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
}
