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
  imageUrl?: string | null;
  datasheetUrl?: string | null;
  media?: any;
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
    sort?: string;
    dir?: string;
    facetFilters?: Array<{ key: string; value: string }>;
  }): Promise<{ items: ProductRecord[]; total: number }> {
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;
    const filters: Prisma.ProductWhereInput[] = [];
    if (params.q) {
      filters.push({
        OR: [
          { name: { contains: params.q, mode: 'insensitive' } },
          { sku: { contains: params.q, mode: 'insensitive' } },
          { description: { contains: params.q, mode: 'insensitive' } }
        ]
      });
    }
    if (params.category) {
      filters.push({ category: params.category });
    }
    if (params.brand) {
      filters.push({
        facets: {
          array_contains: [{ key: 'brand', value: params.brand }]
        } as any
      });
    }
    if (params.facetFilters?.length) {
      params.facetFilters.forEach((facet) => {
        filters.push({
          facets: {
            array_contains: [{ key: facet.key, value: facet.value }]
          } as any
        });
      });
    }

    const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};
    const direction: Prisma.SortOrder = params.dir?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    const sortKey = params.sort?.toLowerCase();
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sortKey === 'price'
        ? [{ msrp: direction }, { unitCost: direction }, { name: 'asc' }]
        : sortKey === 'leadtime'
        ? [{ leadTimeDays: direction }, { name: 'asc' }]
        : sortKey === 'created'
        ? [{ createdAt: direction }]
        : [{ name: direction }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
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

  async listFamilies(params: {
    q?: string;
    category?: string;
    brand?: string;
    facetFilters?: Array<{ key: string; value: string }>;
  }) {
    const filters: Prisma.ProductWhereInput[] = [];
    if (params.q) {
      filters.push({
        OR: [
          { name: { contains: params.q, mode: 'insensitive' } },
          { sku: { contains: params.q, mode: 'insensitive' } },
          { description: { contains: params.q, mode: 'insensitive' } }
        ]
      });
    }
    if (params.category) {
      filters.push({ category: params.category });
    }
    if (params.brand) {
      filters.push({
        facets: {
          array_contains: [{ key: 'brand', value: params.brand }]
        } as any
      });
    }
    if (params.facetFilters?.length) {
      params.facetFilters.forEach((facet) => {
        filters.push({
          facets: {
            array_contains: [{ key: facet.key, value: facet.value }]
          } as any
        });
      });
    }

    const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};
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
