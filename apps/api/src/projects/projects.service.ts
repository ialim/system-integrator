import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AddLineItemDto, CreateProjectDto, CreateRoomDto, UpdateLineItemDto, UpdateProjectDto, UpdateRoomDto } from './dto';
import { computeLinePricing, computeProjectTotals } from './pricing';
import { buildBomCsv } from './bom-export';

const toStringOrNull = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString();
  }
  return String(value);
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureProjectActive(project: { archivedAt: Date | null }) {
    if (project.archivedAt) throw new ForbiddenException('Project is archived');
  }

  async createProject(orgId: number, userId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        clientMeta: dto.clientMeta,
        proposalMeta: dto.proposalMeta,
        orgId,
        createdBy: userId
      }
    });
  }

  async list(orgId: number, limit = 20, offset = 0) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { orgId, archivedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.project.count({ where: { orgId, archivedAt: null } })
    ]);
    return { items, total };
  }

  async get(orgId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId, archivedAt: null },
      include: {
        org: {
          select: {
            pricingTier: true,
            taxStatus: true
          }
        },
        rooms: true,
        lineItems: {
          include: {
            product: true,
            room: true
          }
        },
        bomVersions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) throw new NotFoundException('Project not found');
    const pricingOptions = {
      pricingTier: project.org?.pricingTier,
      taxStatus: project.org?.taxStatus,
      clientMeta: project.clientMeta
    };
    const lineItems = project.lineItems.map((li) => ({
      ...li,
      pricing: computeLinePricing(li, pricingOptions)
    }));
    const totals = computeProjectTotals(project.lineItems, pricingOptions);
    const { org, ...rest } = project;
    return { ...rest, lineItems, totals };
  }

  async addLineItem(orgId: number, userId: number, dto: AddLineItemDto) {
    const projectId = dto.projectId;
    if (!projectId) throw new NotFoundException('Project not found');

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();
    this.ensureProjectActive(project);

    if (dto.roomId !== undefined && dto.roomId !== null) {
      const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
      if (!room || room.projectId !== projectId) {
        throw new ForbiddenException('Room not found in this project');
      }
    }

    const lineItem = await this.prisma.lineItem.create({
      data: {
        projectId,
        roomId: dto.roomId,
        productId: dto.productId,
        qty: dto.qty,
        notes: dto.notes,
        source: 'manual'
      },
      include: {
        product: true,
        room: true
      }
    });
    return lineItem;
  }

  async updateLineItem(
    orgId: number,
    projectId: number,
    lineItemId: number,
    dto: UpdateLineItemDto
  ) {
    const lineItem = await this.prisma.lineItem.findUnique({
      where: { id: lineItemId },
      include: { project: true }
    });
    if (!lineItem) throw new NotFoundException('Line item not found');
    if (lineItem.project.orgId !== orgId || lineItem.projectId !== projectId) throw new ForbiddenException();
    this.ensureProjectActive(lineItem.project);

    if (dto.roomId !== undefined && dto.roomId !== null) {
      const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
      if (!room || room.projectId !== projectId) {
        throw new ForbiddenException('Room not found in this project');
      }
    }

    return this.prisma.lineItem.update({
      where: { id: lineItemId },
      data: {
        qty: dto.qty ?? undefined,
        unitPrice: dto.unitPrice === null ? null : dto.unitPrice ?? undefined,
        notes: dto.notes ?? undefined,
        roomId: dto.roomId ?? undefined
      },
      include: {
        product: true,
        room: true
      }
    });
  }

  async removeLineItem(orgId: number, projectId: number, lineItemId: number) {
    const lineItem = await this.prisma.lineItem.findUnique({
      where: { id: lineItemId },
      include: { project: true }
    });
    if (!lineItem) throw new NotFoundException('Line item not found');
    if (lineItem.project.orgId !== orgId || lineItem.projectId !== projectId) throw new ForbiddenException();
    this.ensureProjectActive(lineItem.project);

    await this.prisma.lineItem.delete({ where: { id: lineItemId } });
    return { success: true };
  }

  async snapshotBom(orgId: number, projectId: number, userId: number, comment?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        org: {
          select: {
            pricingTier: true,
            taxStatus: true
          }
        },
        lineItems: {
          include: { product: true, room: true }
        }
      }
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();
    this.ensureProjectActive(project);

    const pricingOptions = {
      pricingTier: project.org?.pricingTier,
      taxStatus: project.org?.taxStatus,
      clientMeta: project.clientMeta
    };

    const snapshot = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      },
      lineItems: project.lineItems.map((li) => {
        const pricing = computeLinePricing(li, pricingOptions);
        return {
          id: li.id,
          qty: li.qty,
          notes: li.notes,
          source: li.source,
          room: li.room ? { id: li.room.id, name: li.room.name } : null,
          product: li.product
            ? {
                id: li.product.id,
                sku: li.product.sku,
                name: li.product.name,
                category: li.product.category,
                currency: li.product.currency,
                unitCost: toStringOrNull(li.product.unitCost),
                msrp: toStringOrNull(li.product.msrp)
              }
            : null,
          unitPrice: toStringOrNull(li.unitPrice),
          pricing: {
            baseUnitPrice: toStringOrNull(pricing.baseUnitPrice),
            effectiveUnitPrice: toStringOrNull(pricing.effectiveUnitPrice),
            tierDiscount: pricing.tierDiscount,
            volumeDiscount: pricing.volumeDiscount,
            volumeMinQty: pricing.volumeMinQty,
            discountRate: pricing.discountRate,
            discountTotal: toStringOrNull(pricing.discountTotal),
            lineTotal: toStringOrNull(pricing.total),
            override: pricing.override
          }
        };
      })
    };

    const totals = computeProjectTotals(project.lineItems, pricingOptions);

    return this.prisma.bOMVersion.create({
      data: {
        projectId: project.id,
        snapshot,
        totals,
        createdBy: userId
      }
    });
  }

  async exportBomVersion(orgId: number, projectId: number, versionId: number) {
    const bomVersion = await this.prisma.bOMVersion.findFirst({
      where: { id: versionId, projectId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            orgId: true
          }
        }
      }
    });
    if (!bomVersion) throw new NotFoundException('BOM snapshot not found');
    if (bomVersion.project.orgId !== orgId) throw new ForbiddenException();

    const csv = buildBomCsv(bomVersion.snapshot, bomVersion.totals, bomVersion.project);
    const filename = `project-${projectId}-bom-${versionId}.csv`;
    return { csv, filename };
  }

  async getBomVersion(orgId: number, projectId: number, versionId: number) {
    const bomVersion = await this.prisma.bOMVersion.findFirst({
      where: { id: versionId, projectId },
      include: {
        project: {
          select: {
            orgId: true
          }
        }
      }
    });
    if (!bomVersion) throw new NotFoundException('BOM snapshot not found');
    if (bomVersion.project.orgId !== orgId) throw new ForbiddenException();

    return {
      id: bomVersion.id,
      projectId: bomVersion.projectId,
      snapshot: bomVersion.snapshot,
      totals: bomVersion.totals,
      createdAt: bomVersion.createdAt
    };
  }

  async shareBomVersion(orgId: number, projectId: number, versionId: number) {
    const bomVersion = await this.prisma.bOMVersion.findFirst({
      where: { id: versionId, projectId },
      include: {
        project: {
          select: {
            orgId: true
          }
        }
      }
    });
    if (!bomVersion) throw new NotFoundException('BOM snapshot not found');
    if (bomVersion.project.orgId !== orgId) throw new ForbiddenException();

    if (bomVersion.shareId) return { shareId: bomVersion.shareId };

    const shareId = randomUUID();
    const updated = await this.prisma.bOMVersion.update({
      where: { id: bomVersion.id },
      data: { shareId }
    });
    return { shareId: updated.shareId };
  }

  async createRoom(orgId: number, projectId: number, dto: CreateRoomDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();
    this.ensureProjectActive(project);

    return this.prisma.room.create({
      data: {
        name: dto.name,
        projectId
      }
    });
  }

  async renameRoom(orgId: number, projectId: number, roomId: number, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { project: true }
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.projectId !== projectId || room.project.orgId !== orgId) throw new ForbiddenException();
    this.ensureProjectActive(room.project);

    return this.prisma.room.update({
      where: { id: roomId },
      data: { name: dto.name }
    });
  }

  async deleteRoom(orgId: number, projectId: number, roomId: number) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { project: true }
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.projectId !== projectId || room.project.orgId !== orgId) throw new ForbiddenException();
    this.ensureProjectActive(room.project);

    await this.prisma.$transaction([
      this.prisma.lineItem.updateMany({
        where: { roomId },
        data: { roomId: null }
      }),
      this.prisma.room.delete({ where: { id: roomId } })
    ]);
    return { success: true };
  }

  async renameProject(orgId: number, projectId: number, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();
    this.ensureProjectActive(project);

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.clientMeta !== undefined) data.clientMeta = dto.clientMeta;
    if (dto.proposalMeta !== undefined) data.proposalMeta = dto.proposalMeta;
    if (Object.keys(data).length === 0) return project;

    return this.prisma.project.update({
      where: { id: projectId },
      data
    });
  }

  async archiveProject(orgId: number, projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();

    if (project.archivedAt) return project;

    return this.prisma.project.update({
      where: { id: projectId },
      data: { archivedAt: new Date() }
    });
  }

  async deleteProject(orgId: number, projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.order.deleteMany({ where: { projectId } }),
      this.prisma.bOMVersion.deleteMany({ where: { projectId } }),
      this.prisma.lineItem.deleteMany({ where: { projectId } }),
      this.prisma.room.deleteMany({ where: { projectId } }),
      this.prisma.project.delete({ where: { id: projectId } })
    ]);
    return { success: true };
  }
}
