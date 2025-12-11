/**
 * Generate SQL seed from sample-data/product_sample.normalized.json
 * Run: pnpm seed:products:sql
 * Outputs: sample-data/product_seed.sql
 */
import { readFileSync, writeFileSync } from "node:fs";

const INPUT = "sample-data/product_sample.normalized.json";
const OUTPUT = "sample-data/product_seed.sql";

const products = JSON.parse(readFileSync(INPUT, "utf8"));

const header = `-- Seed products
-- Generated from ${INPUT}

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

`;

function sqlEscape(str) {
  return String(str).replace(/'/g, "''");
}

const rows = products
  .map((p) => {
    const cols = {
      sku: `'${sqlEscape(p.sku)}'`,
      name: `'${sqlEscape(p.name)}'`,
      description: p.description ? `'${sqlEscape(p.description)}'` : "NULL",
      category: p.category ? `'${sqlEscape(p.category)}'` : "NULL",
      unit_cost: p.unitCost ?? "NULL",
      currency: p.currency ? `'${sqlEscape(p.currency)}'` : "NULL",
      msrp: p.msrp ?? "NULL",
      margin: p.margin ?? "NULL",
      base_margin: p.baseMargin ?? "NULL",
      tier_base_discount: p.tierBaseDiscount ?? "NULL",
      tier_plus_discount: p.tierPlusDiscount ?? "NULL",
      volume_breaks: p.volumeBreaks ? `'${sqlEscape(p.volumeBreaks)}'::jsonb` : "NULL",
      lead_time_days: p.leadTimeDays ?? "NULL",
      stock_band: p.stockBand ? `'${sqlEscape(p.stockBand)}'` : "NULL",
      facets: p.facets ? `'${sqlEscape(JSON.stringify(p.facets))}'::jsonb` : "NULL",
      variant_facets: p.variantFacets ? `'${sqlEscape(JSON.stringify(p.variantFacets))}'::jsonb` : "NULL",
      compat_requires: p.compatRequires ? `'${sqlEscape(JSON.stringify(p.compatRequires))}'::jsonb` : "NULL",
      compat_blocks: p.compatBlocks ? `'${sqlEscape(JSON.stringify(p.compatBlocks))}'::jsonb` : "NULL",
      bundle_components: p.bundleComponents ? `'${sqlEscape(p.bundleComponents)}'` : "NULL",
      supplier: p.supplier ? `'${sqlEscape(JSON.stringify(p.supplier))}'::jsonb` : "NULL",
      pricing: p.pricing ? `'${sqlEscape(JSON.stringify(p.pricing))}'::jsonb` : "NULL"
    };

    const columns = Object.keys(cols).join(", ");
    const values = Object.values(cols).join(", ");
    return `INSERT INTO products (${columns}) VALUES (${values}) ON CONFLICT (sku) DO UPDATE SET updated_at = NOW();`;
  })
  .join("\n");

writeFileSync(OUTPUT, header + rows + "\n", "utf8");
console.log(`Wrote SQL seed for ${products.length} products to ${OUTPUT}`);
