import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderTrackingDto } from './dto';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const isPlainObject = (value: any) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeCharge = (
  value: any,
  fallbackAmount: any,
  fallbackCurrency?: any,
  fallbackMeta?: any
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === null) return Prisma.DbNull;
  if (isPlainObject(value)) {
    const next = { ...(value as Record<string, any>) };
    if (next.cost === undefined && next.amount === undefined && fallbackAmount !== undefined && fallbackAmount !== null) {
      next.cost = toNumber(fallbackAmount);
    }
    if (next.currency === undefined && fallbackCurrency) {
      next.currency = fallbackCurrency;
    }
    if (next.meta === undefined && fallbackMeta !== undefined && fallbackMeta !== null) {
      next.meta = fallbackMeta;
    }
    return next;
  }
  if (typeof value === 'number') {
    return {
      cost: toNumber(value),
      currency: fallbackCurrency,
      meta: fallbackMeta ?? undefined
    };
  }
  if (fallbackAmount === undefined || fallbackAmount === null) return undefined;
  return {
    cost: toNumber(fallbackAmount),
    currency: fallbackCurrency,
    meta: fallbackMeta ?? undefined
  };
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: number, dto: CreateOrderDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, orgId: true, archivedAt: true }
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();
    if (project.archivedAt) throw new ForbiddenException('Project is archived');

    const bomVersion = await this.prisma.bOMVersion.findFirst({
      where: { id: dto.bomVersionId, projectId: dto.projectId }
    });
    if (!bomVersion) throw new NotFoundException('BOM snapshot not found');

    const totals = (bomVersion.totals as any) || {};
    const resolvedTotal = dto.total ?? totals.total ?? totals.subtotal ?? 0;
    const shipping = normalizeCharge(dto.shipping, totals.shipping, totals.currency, totals.shippingMeta);
    const tax = normalizeCharge(dto.tax, totals.tax, totals.currency, totals.taxMeta);

    return this.prisma.order.create({
      data: {
        projectId: dto.projectId,
        bomVersionId: dto.bomVersionId,
        type: dto.type ?? 'QUOTE',
        status: 'DRAFT',
        shipping,
        tax,
        total: toNumber(resolvedTotal),
        tracking: dto.tracking ?? undefined
      },
      include: {
        project: { select: { id: true, name: true } },
        bomVersion: { select: { id: true, createdAt: true } }
      }
    });
  }

  async list(
    orgId: number,
    params: { limit?: number; offset?: number; projectId?: number }
  ): Promise<{ items: any[]; total: number }> {
    const limit = Math.min(params.limit ?? 20, 100);
    const offset = params.offset ?? 0;
    const where: Prisma.OrderWhereInput = {
      project: { orgId }
    };
    if (params.projectId) {
      where.projectId = params.projectId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          project: { select: { id: true, name: true } },
          bomVersion: { select: { id: true, createdAt: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }),
      this.prisma.order.count({ where })
    ]);
    return { items, total };
  }

  async get(orgId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, project: { orgId } },
      include: {
        project: { select: { id: true, name: true } },
        bomVersion: { select: { id: true, createdAt: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(orgId: number, orderId: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, project: { orgId } },
      select: { id: true }
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status }
    });
  }

  async updateTracking(orgId: number, orderId: number, dto: UpdateOrderTrackingDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, project: { orgId } },
      select: { id: true }
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { tracking: dto.tracking ?? undefined }
    });
  }

  async shareOrder(orgId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, project: { orgId } },
      select: { id: true, shareId: true }
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shareId) return { shareId: order.shareId };

    const shareId = randomUUID();
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { shareId }
    });
    return { shareId: updated.shareId };
  }
}
