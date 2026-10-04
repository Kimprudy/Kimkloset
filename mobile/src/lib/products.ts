import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

// Kept in memory so opening a product from the shop is instant.
let cache: Product[] | null = null;

export async function fetchProducts(): Promise<Product[]> {
  const { products } = await api<{ products: Product[] }>('/api/products');
  cache = products;
  return products;
}

export function cachedProducts() {
  return cache;
}

export function cachedProduct(slug: string) {
  return cache?.find((p) => p.slug === slug) ?? null;
}
