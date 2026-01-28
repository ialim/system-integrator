import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto, UpdateOrgProfileDto, UpdateUserRoleDto } from './dto';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(orgId: number) {
    const org = await this.prisma.org.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        businessAddress: true,
        proposalDefaults: true
      }
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateProfile(orgId: number, dto: UpdateOrgProfileDto) {
    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.businessAddress !== undefined) data.businessAddress = dto.businessAddress;
    if (dto.proposalDefaults !== undefined) data.proposalDefaults = dto.proposalDefaults;

    if (!Object.keys(data).length) {
      return this.getProfile(orgId);
    }

    return this.prisma.org.update({
      where: { id: orgId },
      data,
      select: {
        id: true,
        name: true,
        businessAddress: true,
        proposalDefaults: true
      }
    });
  }

  async listUsers(orgId: number) {
    return this.prisma.user.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true
      }
    });
  }

  async updateUserRole(orgId: number, userId: number, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, orgId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.OWNER && dto.role !== Role.OWNER) {
      const owners = await this.prisma.user.count({ where: { orgId, role: Role.OWNER } });
      if (owners <= 1) {
        throw new ForbiddenException('At least one owner is required');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        emailVerifiedAt: true
      }
    });
  }

  async listInvites(orgId: number) {
    return this.prisma.invite.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createInvite(orgId: number, createdBy: number, dto: CreateInviteDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    await this.prisma.invite.updateMany({
      where: {
        orgId,
        email,
        revokedAt: null,
        acceptedAt: null
      },
      data: { revokedAt: new Date() }
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await this.prisma.invite.create({
      data: {
        orgId,
        email,
        role: dto.role ?? Role.ESTIMATOR,
        token,
        createdBy,
        expiresAt
      }
    });

    return invite;
  }

  async revokeInvite(orgId: number, inviteId: number) {
    const invite = await this.prisma.invite.findFirst({ where: { id: inviteId, orgId } });
    if (!invite) throw new NotFoundException('Invite not found');

    if (invite.revokedAt) return invite;

    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { revokedAt: new Date() }
    });
  }
}
