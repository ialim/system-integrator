const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export type Product = {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  familyId?: number | null;
  family?: ProductFamily | null;
  currency?: string;
  unitCost?: number;
  msrp?: number;
  leadTimeDays?: number | null;
  stockBand?: string | null;
  facets?: { key: string; value: string }[];
  supplier?: any;
  pricing?: any;
};

export type ProductFamily = {
  id: number | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  defaultImage?: string | null;
  attributes?: Record<string, any> | null;
};

export async function fetchProducts(params?: {
  q?: string;
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  if (params?.brand) search.set('brand', params.brand);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));

  const url = `${API_URL}/products${search.toString() ? `?${search.toString()}` : ''}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch products (${res.status})`);
  }
  const data = await res.json();
  return data as { items: Product[]; total: number; limit: number; offset: number };
}

export async function fetchProduct(sku: string) {
  const url = `${API_URL}/products/${encodeURIComponent(sku)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch product (${res.status})`);
  }
  return (await res.json()) as Product;
}

export async function fetchProductFamilies(params?: { q?: string; category?: string; brand?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  if (params?.brand) search.set('brand', params.brand);

  const url = `${API_URL}/products/families${search.toString() ? `?${search.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch product families (${res.status})`);
  }
  return (await res.json()) as { items: Array<{ family: ProductFamily; variants: Product[] }> };
}
