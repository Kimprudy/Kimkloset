import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';
import { apiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/products — every active product (no sign-in needed). */
export async function GET() {
  const { products, error } = await getProducts();
  if (error) {
    console.error('[api/products]', error);
    return apiError('Could not load products. Please try again.', 500);
  }
  return NextResponse.json({ products });
}
