import { Injectable, Logger } from '@nestjs/common';
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
  constructor(private readonly pool: Pool) {}

  async list(limit = 20, offset = 0): Promise<ProductRecord[]> {
    const result = await this.pool.query(
      'SELECT * FROM products ORDER BY name ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  async getBySku(sku: string): Promise<ProductRecord | null> {
    const result = await this.pool.query('SELECT * FROM products WHERE sku = $1', [sku]);
    if (!result.rowCount) return null;
    return result.rows[0];
  }
}
