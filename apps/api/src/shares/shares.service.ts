import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProposalResponseDto } from './dto';

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizePercent = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = toNumber(value);
  if (!Number.isFinite(parsed)) return null;
  return clamp(parsed, 0, 100);
};

@Injectable()
export class SharesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSharedBomVersion(shareId: string) {
    const bomVersion = await this.prisma.bOMVersion.findUnique({
      where: { shareId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientMeta: true,
            proposalMeta: true,
            org: {
              select: {
                name: true,
                businessAddress: true,
                paymentTerms: true,
                proposalDefaults: true
              }
            }
          }
        }
      }
    });
    if (!bomVersion) throw new NotFoundException('Shared snapshot not found');

    const projectMeta =
      bomVersion.project?.proposalMeta && typeof bomVersion.project.proposalMeta === 'object'
        ? (bomVersion.project.proposalMeta as Record<string, any>)
        : null;
    const orgDefaults =
      bomVersion.project?.org?.proposalDefaults && typeof bomVersion.project.org.proposalDefaults === 'object'
        ? (bomVersion.project.org.proposalDefaults as Record<string, any>)
        : null;

    const projectMarkupRaw = projectMeta?.markupPercent;
    const projectMarkup = normalizePercent(projectMarkupRaw);
    const orgMarkupRaw = orgDefaults?.markupPercent;
    const orgMarkup = normalizePercent(orgMarkupRaw);

    let markupPercent = 0;
    let source: 'project' | 'org' | 'none' = 'none';
    if (projectMarkupRaw !== null && projectMarkupRaw !== undefined && projectMarkup !== null) {
      markupPercent = projectMarkup;
      source = 'project';
    } else if (orgMarkupRaw !== null && orgMarkupRaw !== undefined && orgMarkup !== null) {
      markupPercent = orgMarkup;
      source = 'org';
    }

    const response =
      bomVersion.proposalResponse && typeof bomVersion.proposalResponse === 'object'
        ? (bomVersion.proposalResponse as Record<string, any>)
        : null;
    const status = response?.status === 'ACCEPTED' || response?.status === 'DECLINED' ? response.status : 'PENDING';

    return {
      id: bomVersion.id,
      projectId: bomVersion.projectId,
      project: {
        id: bomVersion.project.id,
        name: bomVersion.project.name,
        clientMeta: bomVersion.project.clientMeta
      },
      org: {
        name: bomVersion.project.org?.name,
        businessAddress: bomVersion.project.org?.businessAddress ?? null,
        paymentTerms: bomVersion.project.org?.paymentTerms ?? null,
        proposalDefaults: bomVersion.project.org?.proposalDefaults ?? null
      },
      snapshot: bomVersion.snapshot,
      totals: bomVersion.totals,
      createdAt: bomVersion.createdAt,
      proposal: {
        markupPercent,
        source,
        status,
        response
      }
    };
  }

  async respondToProposal(shareId: string, dto: ProposalResponseDto) {
    const bomVersion = await this.prisma.bOMVersion.findUnique({
      where: { shareId },
      select: {
        id: true,
        proposalResponse: true
      }
    });
    if (!bomVersion) throw new NotFoundException('Shared snapshot not found');

    const existing =
      bomVersion.proposalResponse && typeof bomVersion.proposalResponse === 'object'
        ? (bomVersion.proposalResponse as Record<string, any>)
        : null;
    if (existing?.status === 'ACCEPTED' || existing?.status === 'DECLINED') {
      return { status: existing.status, response: existing };
    }

    const response = {
      status: dto.status,
      name: dto.name?.trim() || null,
      email: dto.email?.trim() || null,
      note: dto.note?.trim() || null,
      respondedAt: new Date().toISOString()
    };

    const updated = await this.prisma.bOMVersion.update({
      where: { id: bomVersion.id },
      data: { proposalResponse: response }
    });

    return {
      status: response.status,
      response: updated.proposalResponse
    };
  }

  async getSharedOrder(shareId: string) {
    const order = await this.prisma.order.findUnique({
      where: { shareId },
      include: {
        project: { select: { id: true, name: true } },
        bomVersion: { select: { id: true, snapshot: true, totals: true, createdAt: true } }
      }
    });
    if (!order) throw new NotFoundException('Shared order not found');

    return {
      id: order.id,
      projectId: order.projectId,
      project: order.project,
      type: order.type,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      bomVersion: order.bomVersion
    };
  }
}
