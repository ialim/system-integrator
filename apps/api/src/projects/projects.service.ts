import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddLineItemDto, CreateProjectDto } from './dto';

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
        bomVersions: true
      }
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async addLineItem(orgId: number, userId: number, dto: AddLineItemDto) {
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.orgId !== orgId) throw new ForbiddenException();

    const lineItem = await this.prisma.lineItem.create({
      data: {
        projectId: dto.projectId,
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
}
