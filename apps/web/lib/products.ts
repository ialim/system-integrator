const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type Product = {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  currency?: string;
  unit_cost?: number;
  msrp?: number;
  stock_band?: string;
  facets?: { key: string; value: string }[];
};

export async function fetchProducts(params?: {
  q?: string;
  category?: string;
  brand?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  if (params?.brand) search.set('brand', params.brand);
  if (params?.limit) search.set('limit', String(params.limit));

  const url = `${API_URL}/products${search.toString() ? `?${search.toString()}` : ''}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch products (${res.status})`);
  }
  const data = await res.json();
  return data as { items: Product[]; total: number; limit: number; offset: number };
}
