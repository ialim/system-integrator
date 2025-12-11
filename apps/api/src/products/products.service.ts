import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type ProductRecord = {
  sku: string;
  name: string;
  description?: string | null;
  category?: string | null;
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
        path: '$[*]',
        array_contains: [{ key: 'brand', value: params.brand }]
      } as any;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      }),
      this.prisma.product.count({ where })
    ]);
    return { items, total };
  }

  async getBySku(sku: string): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findUnique({ where: { sku } });
    return (product as any) || null;
  }
}
