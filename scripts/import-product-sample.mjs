/**
 * Parse sample-data/product_sample.csv into normalized JSON for seeding.
 * Run: pnpm seed:products
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const INPUT = "sample-data/product_sample.csv";
const OUTPUT = "sample-data/product_sample.normalized.json";

function parseFacetString(raw) {
  if (!raw || !raw.trim()) return [];
  const trimmed = raw.trim();
  const inside = trimmed.startsWith("[") && trimmed.endsWith("]")
    ? trimmed.slice(1, -1)
    : trimmed;
  return inside
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [k, ...rest] = entry.split(":");
      return { key: (k || "").trim(), value: rest.join(":").trim() };
    })
    .filter((item) => item.key && item.value);
}

function parseNumber(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(String(raw).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const csv = readFileSync(INPUT, "utf8");
const records = parse(csv, {
  columns: true,
  skip_empty_lines: true
});

const normalized = records.map((r) => {
  const facets = parseFacetString(r.facets);
  const variantFacets = parseFacetString(r.variant_facets);
  return {
    sku: r.sku,
    name: r.name,
    description: r.description,
    category: r.category,
    facets,
    variantFacets,
    unitCost: parseNumber(r.unit_cost),
    currency: r.currency || "NGN",
    msrp: parseNumber(r.msrp),
    margin: parseNumber(r.margin),
    baseMargin: parseNumber(r.base_margin),
    tierBaseDiscount: parseNumber(r.tier_base_discount),
    tierPlusDiscount: parseNumber(r.tier_plus_discount),
    volumeBreaks: r.volume_breaks ? r.volume_breaks : "",
    leadTimeDays: parseNumber(r.lead_time_days),
    stockBand: r.stock_band || "",
    compatRequires: parseFacetString(r.compat_requires).map((c) => c.value || c.key),
    compatBlocks: parseFacetString(r.compat_blocks).map((c) => c.value || c.key),
    bundleComponents: r.bundle_components || "",
    supplier: {
      name: r.supplier || "",
      sku: r.supplier_sku || "",
      unitCost: parseNumber(r.supplier_unit_cost),
      currency: r.supplier_currency || "",
      fxRate: parseNumber(r.rate),
      shippingRate: parseNumber(r.supplier_shipping_rate),
      vat: parseNumber(r.vat)
    },
    pricing: {
      baseUnitCostNGN: parseNumber(r.base_unit_cost_ngn),
      categoryMargin: parseNumber(r.category_margin),
      baseCostNGN: parseNumber(r.base_cost_ngn),
      msrpNGN: parseNumber(r.msrp_ngn),
      resellerPriceNGN: parseNumber(r.reseller_price_ngn),
      resellerBase: parseNumber(r.reseller_base),
      resellerPlus: parseNumber(r.reseller_plus)
    }
  };
});

writeFileSync(OUTPUT, JSON.stringify(normalized, null, 2), "utf8");
console.log(`Wrote ${normalized.length} products to ${OUTPUT}`);
