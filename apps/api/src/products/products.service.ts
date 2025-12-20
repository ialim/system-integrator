import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type ProductRecord = {
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
  familyId?: number | null;
  family?: ProductFamilyRecord | null;
  unitCost?: any;
  currency?: string | null;
  msrp?: any;
  margin?: any;
  baseMargin?: any;
  tierBaseDiscount?: any;
  tierPlusDiscount?: any;
  volumeBreaks?: any;
  leadTimeDays?: number | null;
  stockBand?: string | null;
  facets?: any;
  variantFacets?: any;
  compatRequires?: any;
  compatBlocks?: any;
  bundleComponents?: string | null;
  supplier?: any;
  pricing?: any;
};

export type ProductFamilyRecord = {
  id: number | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  description?: string | null;
  defaultImage?: string | null;
  attributes?: any;
};

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    limit?: number;
    offset?: number;
    q?: string;
    category?: string;
    brand?: string;
  }): Promise<{ items: ProductRecord[]; total: number }> {
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;
    const where: Prisma.ProductWhereInput = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } }
      ];
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.brand) {
      where.facets = {
        path: ['*'],
        array_contains: [{ key: 'brand', value: params.brand }]
      } as any;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
        include: { family: true }
      }),
      this.prisma.product.count({ where })
    ]);
    return { items, total };
  }

  async getBySku(sku: string): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findUnique({ where: { sku }, include: { family: true } });
    return (product as any) || null;
  }

  async listFamilies(params: { q?: string; category?: string; brand?: string }) {
    const where: Prisma.ProductWhereInput = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } }
      ];
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.brand) {
      where.facets = {
        path: ['*'],
        array_contains: [{ key: 'brand', value: params.brand }]
      } as any;
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: [{ familyId: 'asc' }, { name: 'asc' }],
      include: { family: true }
    });

    const familiesMap = new Map<
      string,
      {
        family: ProductFamilyRecord;
        variants: ProductRecord[];
      }
    >();

    for (const p of products as any[]) {
      const fam: ProductFamilyRecord =
        p.family && p.family.id
          ? {
              id: p.family.id,
              name: p.family.name,
              brand: p.family.brand,
              category: p.family.category,
              description: p.family.description,
              defaultImage: p.family.defaultImage,
              attributes: p.family.attributes
            }
          : {
              id: null,
              name: p.name,
              brand: (p.facets || [])?.find((f: any) => f.key === 'brand')?.value || null,
              category: p.category,
              description: p.description,
              defaultImage: null,
              attributes: p.variantFacets
            };
      const key = fam.id ? `id-${fam.id}` : `${fam.name || ''}-${fam.brand || ''}`;
      if (!familiesMap.has(key)) {
        familiesMap.set(key, { family: fam, variants: [] });
      }
      familiesMap.get(key)!.variants.push(p);
    }

    return Array.from(familiesMap.values());
  }
}
