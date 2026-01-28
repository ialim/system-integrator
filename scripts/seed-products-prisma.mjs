/**
 * Seed products (and inferred families) into the database using Prisma.
 * Run from repo root: pnpm seed:products:db
 */
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const data = await readFile("sample-data/product_sample.normalized.json", "utf8");
  const products = JSON.parse(data);

  // Build family map from inferred familyName/familyBrand
  const familyMap = new Map();
  for (const p of products) {
    if (p.familyName) {
      const key = `${p.familyName}|${p.familyBrand || ""}`;
      if (!familyMap.has(key)) {
        familyMap.set(key, {
          name: p.familyName,
          brand: p.familyBrand || null,
          category: p.familyCategory || p.category || null,
          description: p.description || null,
          defaultImage: null,
          attributes: p.variantFacets || null
        });
      }
    }
  }

  const familyIdMap = new Map();
  for (const [key, fam] of familyMap.entries()) {
    const existing = await prisma.productFamily.findFirst({
      where: {
        name: fam.name,
        brand: fam.brand
      }
    });
    let family;
    if (existing) {
      family = await prisma.productFamily.update({
        where: { id: existing.id },
        data: {
          category: fam.category ?? existing.category,
          description: fam.description ?? existing.description,
          defaultImage: fam.defaultImage ?? existing.defaultImage,
          attributes: fam.attributes ?? existing.attributes
        }
      });
    } else {
      family = await prisma.productFamily.create({
        data: fam
      });
    }
    familyIdMap.set(key, family.id);
  }

  for (const p of products) {
    const familyKey = p.familyName ? `${p.familyName}|${p.familyBrand || ""}` : null;
    const familyId = familyKey ? familyIdMap.get(familyKey) : null;
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description || null,
        category: p.category || null,
        familyId: familyId ?? null,
        imageUrl: p.imageUrl || null,
        datasheetUrl: p.datasheetUrl || null,
        media: p.media || null,
        unitCost: p.unitCost ?? null,
        currency: p.currency || null,
        msrp: p.msrp ?? null,
        margin: p.margin ?? null,
        baseMargin: p.baseMargin ?? null,
        tierBaseDiscount: p.tierBaseDiscount ?? null,
        tierPlusDiscount: p.tierPlusDiscount ?? null,
        volumeBreaks: p.volumeBreaks || null,
        leadTimeDays: p.leadTimeDays ?? null,
        stockBand: p.stockBand || null,
        facets: p.facets || null,
        variantFacets: p.variantFacets || null,
        compatRequires: p.compatRequires || null,
        compatBlocks: p.compatBlocks || null,
        bundleComponents: p.bundleComponents || null,
        supplier: p.supplier || null,
        pricing: p.pricing || null
      },
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description || null,
        category: p.category || null,
        familyId: familyId ?? null,
        imageUrl: p.imageUrl || null,
        datasheetUrl: p.datasheetUrl || null,
        media: p.media || null,
        unitCost: p.unitCost ?? null,
        currency: p.currency || null,
        msrp: p.msrp ?? null,
        margin: p.margin ?? null,
        baseMargin: p.baseMargin ?? null,
        tierBaseDiscount: p.tierBaseDiscount ?? null,
        tierPlusDiscount: p.tierPlusDiscount ?? null,
        volumeBreaks: p.volumeBreaks || null,
        leadTimeDays: p.leadTimeDays ?? null,
        stockBand: p.stockBand || null,
        facets: p.facets || null,
        variantFacets: p.variantFacets || null,
        compatRequires: p.compatRequires || null,
        compatBlocks: p.compatBlocks || null,
        bundleComponents: p.bundleComponents || null,
        supplier: p.supplier || null,
        pricing: p.pricing || null
      }
    });
  }

  console.log(`Seeded ${products.length} products and ${familyMap.size} families`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
