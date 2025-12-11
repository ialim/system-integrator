-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_cost NUMERIC,
  currency TEXT,
  msrp NUMERIC,
  margin NUMERIC,
  base_margin NUMERIC,
  tier_base_discount NUMERIC,
  tier_plus_discount NUMERIC,
  volume_breaks JSONB,
  lead_time_days INTEGER,
  stock_band TEXT,
  facets JSONB,
  variant_facets JSONB,
  compat_requires JSONB,
  compat_blocks JSONB,
  bundle_components TEXT,
  supplier JSONB,
  pricing JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_facets_gin ON products USING gin (facets);
