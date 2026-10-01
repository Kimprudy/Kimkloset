import { createClient } from '@/lib/supabase/server';
import type { Product } from '@/lib/types';

const PRODUCT_FIELDS = 'id, slug, name, description, price, category, sizes, colors, image_url, stock';

export async function getProducts(): Promise<{ products: Product[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) return { products: [], error: error.message };
    return { products: (data ?? []) as Product[], error: null };
  } catch (err) {
    return { products: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return (data as Product | null) ?? null;
}
