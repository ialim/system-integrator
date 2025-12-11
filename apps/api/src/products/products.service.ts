import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL } from '../providers/db.provider';

export type ProductRecord = {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit_cost?: number;
  currency?: string;
  msrp?: number;
  margin?: number;
  base_margin?: number;
  tier_base_discount?: number;
  tier_plus_discount?: number;
  volume_breaks?: any;
  lead_time_days?: number;
  stock_band?: string;
  facets?: any;
  variant_facets?: any;
  compat_requires?: any;
  compat_blocks?: any;
  bundle_components?: string;
  supplier?: any;
  pricing?: any;
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(params: {
    limit?: number;
    offset?: number;
    q?: string;
    category?: string;
    brand?: string;
  }): Promise<{ items: ProductRecord[]; total: number }> {
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;
    const values: any[] = [];
    const where: string[] = [];

    if (params.q) {
      values.push(`%${params.q}%`);
      values.push(`%${params.q}%`);
      where.push(`(name ILIKE $${values.length - 1} OR description ILIKE $${values.length})`);
    }

    if (params.category) {
      values.push(params.category);
      where.push(`category = $${values.length}`);
    }

    if (params.brand) {
      values.push(params.brand);
      where.push(
        `EXISTS (SELECT 1 FROM jsonb_array_elements(facets) f WHERE f->>'key' = 'brand' AND f->>'value' ILIKE $${values.length})`
      );
    }

    values.push(limit);
    values.push(offset);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const query = `
      SELECT *,
        COUNT(*) OVER() AS total_count
      FROM products
      ${whereSql}
      ORDER BY name ASC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `;
    const result = await this.pool.query(query, values);
    const total = result.rows[0]?.total_count ? Number(result.rows[0].total_count) : 0;
    return { items: result.rows, total };
  }

  async getBySku(sku: string): Promise<ProductRecord | null> {
    const result = await this.pool.query('SELECT * FROM products WHERE sku = $1', [sku]);
    if (!result.rowCount) return null;
    return result.rows[0];
  }
}
