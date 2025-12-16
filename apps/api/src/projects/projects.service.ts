import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddLineItemDto, CreateProjectDto, CreateRoomDto, UpdateLineItemDto, UpdateRoomDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(orgId: number, userId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        clientMeta: dto.clientMeta,
        orgId,
        createdBy: userId
      }
    });
  }

  async list(orgId: number, limit = 20, offset = 0) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      this.prisma.project.count({ where: { orgId } })
    ]);
    return { items, total };
  }

  async get(orgId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
      include: {
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
    return project;
  }

  async addLineItem(orgId: number, userId: number, dto: AddLineItemDto) {
    const projectId = dto.projectId;
    if (!projectId) throw new NotFoundException('Project not found');

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();

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

    await this.prisma.lineItem.delete({ where: { id: lineItemId } });
    return { success: true };
  }

  async snapshotBom(orgId: number, projectId: number, userId: number, comment?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        lineItems: {
          include: { product: true, room: true }
        }
      }
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();

    const snapshot = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      },
      lineItems: project.lineItems
    };

    const totals = {
      subtotal: project.lineItems.reduce((sum, li) => {
        const price = li.unitPrice ? Number(li.unitPrice) : 0;
        return sum + price * li.qty;
      }, 0)
    };

    return this.prisma.bOMVersion.create({
      data: {
        projectId: project.id,
        snapshot,
        totals,
        createdBy: userId
      }
    });
  }

  async createRoom(orgId: number, projectId: number, dto: CreateRoomDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();

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

    return this.prisma.room.update({
      where: { id: roomId },
      data: { name: dto.name }
    });
  }
}
