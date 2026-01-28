/**
 * Parse sample-data/product_sample.csv into normalized JSON for seeding.
 * Run: pnpm seed:products
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const INPUT = "sample-data/product_sample.csv";
const OUTPUT = "sample-data/product_sample.normalized.json";

function sanitizeRowKeys(row) {
  // Some CSV exports include a BOM on the first header; normalize it.
  if (row["\uFEFFname"] && !row.name) {
    row.name = row["\uFEFFname"];
  }
  return row;
}

function getField(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
}

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

function parseMediaList(raw) {
  if (!raw || !String(raw).trim()) return [];
  const normalized = String(raw)
    .split(/[|;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return normalized.map((url) => ({ type: "image", url }));
}

function rowCompleteness(row) {
  const fields = [
    "sku",
    "name",
    "description",
    "category",
    "facets",
    "variant_facets",
    "unit_cost",
    "currency",
    "msrp",
    "lead_time_days",
    "stock_band",
    "image_url",
    "datasheet_url",
    "media_urls"
  ];
  return fields.reduce((count, key) => {
    const value = row[key];
    return value === undefined || value === null || String(value).trim() === "" ? count : count + 1;
  }, 0);
}

const csv = readFileSync(INPUT, "utf8");
const records = parse(csv, {
  columns: true,
  skip_empty_lines: true
}).map(sanitizeRowKeys);

const deduped = new Map();
const warnings = [];
for (const r of records) {
  const sku = String(getField(r, ["sku", "SKU"])).trim();
  const name = String(getField(r, ["name", "Name"])).trim();
  if (!sku || !name) {
    warnings.push(`Skipping row with missing sku/name: ${JSON.stringify({ sku, name })}`);
    continue;
  }
  const existing = deduped.get(sku);
  if (!existing) {
    deduped.set(sku, r);
  } else {
    const existingScore = rowCompleteness(existing);
    const nextScore = rowCompleteness(r);
    if (nextScore > existingScore) {
      warnings.push(`Duplicate sku ${sku} found; using row with more data (${nextScore} > ${existingScore}).`);
      deduped.set(sku, r);
    } else {
      warnings.push(`Duplicate sku ${sku} found; keeping earlier row (${existingScore} >= ${nextScore}).`);
    }
  }
}

warnings.forEach((msg) => console.warn(msg));

const normalized = Array.from(deduped.values()).map((r) => {
  const imageUrl = getField(r, ["image_url", "imageUrl", "image", "image_url_primary"]);
  const datasheetUrl = getField(r, ["datasheet_url", "datasheetUrl", "datasheet"]);
  const mediaRaw = getField(r, ["media_urls", "media", "mediaUrls"]);
  const sku = String(getField(r, ["sku", "SKU"])).trim();
  const name = String(getField(r, ["name", "Name"])).trim();
  const facets = parseFacetString(r.facets);
  const variantFacets = parseFacetString(r.variant_facets);
  const brand = facets.find((f) => f.key === "brand")?.value || "";
  return {
    sku,
    name,
    description: r.description,
    category: r.category,
    brand,
    facets,
    variantFacets,
    imageUrl: imageUrl || null,
    datasheetUrl: datasheetUrl || null,
    media: mediaRaw ? parseMediaList(mediaRaw) : null,
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

// Infer families: products sharing the same name + brand become a family.
const familyCounts = normalized.reduce((map, p) => {
  const key = `${p.name}|${p.brand || ""}`;
  map.set(key, (map.get(key) || 0) + 1);
  return map;
}, new Map());

normalized.forEach((p) => {
  const key = `${p.name}|${p.brand || ""}`;
  if ((familyCounts.get(key) || 0) > 1) {
    p.familyName = p.name;
    p.familyBrand = p.brand || null;
    p.familyCategory = p.category || null;
  }
});

writeFileSync(OUTPUT, JSON.stringify(normalized, null, 2), "utf8");
console.log(`Wrote ${normalized.length} products to ${OUTPUT}`);
