/**
 * Sync supplier inventory + lead time into product records.
 * Run: pnpm supplier:sync -- --input sample-data/supplier_inventory.csv --source "Golden Security"
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();

function getArgValue(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const next = args[idx + 1];
  if (!next || next.startsWith("--")) return null;
  return next;
}

function sanitizeRowKeys(row) {
  if (row["\uFEFFsku"] && !row.sku) {
    row.sku = row["\uFEFFsku"];
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

function parseNumber(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(String(raw).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw) {
  if (!raw || !String(raw).trim()) return null;
  const value = new Date(String(raw));
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Usage: pnpm supplier:sync -- --input <csv> --source <name> [--dry-run]");
    return;
  }

  const input = getArgValue(args, "--input") || "sample-data/supplier_inventory.csv";
  const source = getArgValue(args, "--source") || "supplier-feed";
  const dryRun = args.includes("--dry-run");

  const csv = readFileSync(input, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true }).map(sanitizeRowKeys);

  const deduped = new Map();
  for (const row of rows) {
    const sku = String(getField(row, ["sku", "SKU"])).trim();
    if (!sku) continue;
    deduped.set(sku, row);
  }

  let updated = 0;
  let missing = 0;
  let skipped = rows.length - deduped.size;

  for (const [sku, row] of deduped.entries()) {
    const product = await prisma.product.findUnique({
      where: { sku },
      select: { id: true, supplier: true, leadTimeDays: true, stockBand: true }
    });
    if (!product) {
      missing += 1;
      continue;
    }

    const leadTimeDays = parseNumber(getField(row, ["lead_time_days", "leadTimeDays"]));
    const stockBand = String(getField(row, ["stock_band", "stockBand"])).trim() || null;
    const availableQty = parseNumber(getField(row, ["available_qty", "qty_available", "availableQty"]));
    const supplierName = String(getField(row, ["supplier", "supplier_name"])).trim() || null;
    const supplierSku = String(getField(row, ["supplier_sku", "supplierSku"])).trim() || null;
    const sourceUpdatedAt = parseDate(getField(row, ["updated_at", "source_updated_at", "sourceUpdatedAt"]));

    const supplier = product.supplier && typeof product.supplier === "object" ? product.supplier : {};
    const existingInventory =
      supplier && typeof supplier === "object" && supplier.inventory && typeof supplier.inventory === "object"
        ? supplier.inventory
        : {};

    const inventoryUpdates = {
      source,
      lastSyncAt: new Date().toISOString()
    };
    if (availableQty !== null) inventoryUpdates.availableQty = availableQty;
    if (leadTimeDays !== null) inventoryUpdates.leadTimeDays = leadTimeDays;
    if (stockBand) inventoryUpdates.stockBand = stockBand;
    if (sourceUpdatedAt) inventoryUpdates.sourceUpdatedAt = sourceUpdatedAt;

    const nextSupplier = {
      ...supplier,
      ...(supplierName ? { name: supplierName } : {}),
      ...(supplierSku ? { sku: supplierSku } : {}),
      inventory: { ...existingInventory, ...inventoryUpdates }
    };

    const data = {
      supplier: nextSupplier
    };
    if (leadTimeDays !== null) data.leadTimeDays = leadTimeDays;
    if (stockBand) data.stockBand = stockBand;

    if (!dryRun) {
      await prisma.product.update({ where: { sku }, data });
    }
    updated += 1;
  }

  console.log(
    `Supplier sync complete. Updated ${updated} products. Missing SKUs: ${missing}. Skipped rows: ${skipped}.` +
      (dryRun ? " (dry-run)" : "")
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
