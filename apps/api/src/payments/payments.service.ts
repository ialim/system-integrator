import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { env } from '../env';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

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

const normalizeCurrency = (value?: string | null) => {
  if (!value) return 'NGN';
  const trimmed = value.trim();
  if (!trimmed) return 'NGN';
  return trimmed.toUpperCase();
};

async function paystackRequest(path: string, options: RequestInit) {
  if (!env.paystackSecretKey) {
    throw new BadRequestException('Paystack is not configured');
  }
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok || !payload?.status) {
    throw new BadRequestException(payload?.message || 'Paystack request failed');
  }
  return payload;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async initializePaystack(orgId: number, orderId: number, email: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, project: { orgId } },
      include: { bomVersion: true }
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!email) throw new BadRequestException('Email is required');

    const totals = (order.bomVersion?.totals as any) || {};
    const amount = toNumber(order.total ?? totals.total ?? totals.subtotal ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Order total is not payable');
    }

    const currency = normalizeCurrency(totals.currency ?? (order.tax as any)?.currency ?? 'NGN');
    const reference = `order_${orderId}_${Date.now()}`;
    const payload = {
      email,
      amount: Math.round(amount * 100),
      currency,
      reference,
      callback_url: env.paystackCallbackUrl,
      metadata: {
        orderId,
        projectId: order.projectId,
        source: 'system-integrator'
      }
    };

    const response = await paystackRequest('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const data = response.data || {};
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount,
        currency,
        reference,
        provider: 'PAYSTACK',
        status: 'PENDING',
        authorizationUrl: data.authorization_url,
        accessCode: data.access_code,
        metadata: { initialize: response }
      }
    });

    return {
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      reference,
      paymentId: payment.id
    };
  }

  async listOrderPayments(orgId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, project: { orgId } },
      select: { id: true }
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async verifyPaystack(reference: string, context?: { webhook?: any }) {
    if (!reference) throw new BadRequestException('Reference is required');
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    if (!payment) throw new NotFoundException('Payment not found');

    const response = await paystackRequest(`/transaction/verify/${reference}`, { method: 'GET' });
    const data = response.data || {};
    const statusRaw = String(data.status || '').toLowerCase();
    let status: 'PENDING' | 'SUCCESS' | 'FAILED' = 'PENDING';
    if (statusRaw === 'success') status = 'SUCCESS';
    if (statusRaw === 'failed' || statusRaw === 'abandoned') status = 'FAILED';

    const nextMetadata = {
      ...(payment.metadata as any),
      verify: response
    };
    if (context?.webhook) {
      nextMetadata.webhook = context.webhook;
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        metadata: nextMetadata
      }
    });

    if (status === 'SUCCESS') {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'ACCEPTED' }
      });
    }

    return updated;
  }
}
