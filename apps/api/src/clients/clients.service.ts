import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto';

const normalizeText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeEmail = (value?: string | null) => {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : null;
};

const hasField = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: number, dto: CreateClientDto) {
    const name = normalizeText(dto.name);
    if (!name) throw new BadRequestException('Name is required');

    return this.prisma.client.create({
      data: {
        orgId,
        name,
        email: normalizeEmail(dto.email) ?? undefined,
        phone: normalizeText(dto.phone) ?? undefined,
        address: dto.address ?? undefined,
        notes: normalizeText(dto.notes) ?? undefined
      }
    });
  }

  async list(orgId: number, limit = 20, offset = 0) {
    const safeLimit = Math.min(limit || 20, 100);
    const safeOffset = Math.max(offset || 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip: safeOffset,
        take: safeLimit
      }),
      this.prisma.client.count({ where: { orgId } })
    ]);

    return { items, total, limit: safeLimit, offset: safeOffset };
  }

  async get(orgId: number, clientId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId }
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(orgId: number, clientId: number, dto: UpdateClientDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
      select: { id: true }
    });
    if (!client) throw new NotFoundException('Client not found');

    const data: Record<string, any> = {};
    if (hasField(dto, 'name')) {
      const name = normalizeText(dto.name);
      if (!name) throw new BadRequestException('Name is required');
      data.name = name;
    }
    if (hasField(dto, 'email')) {
      data.email = normalizeEmail(dto.email);
    }
    if (hasField(dto, 'phone')) {
      data.phone = normalizeText(dto.phone);
    }
    if (hasField(dto, 'address')) {
      data.address = dto.address ?? null;
    }
    if (hasField(dto, 'notes')) {
      data.notes = normalizeText(dto.notes);
    }

    return this.prisma.client.update({
      where: { id: clientId },
      data
    });
  }

  async remove(orgId: number, clientId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
      select: { id: true }
    });
    if (!client) throw new NotFoundException('Client not found');

    await this.prisma.client.delete({ where: { id: clientId } });
    return { success: true };
  }
}
