import { BadRequestException, Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsJobsService } from './payments.jobs.service';
import { IsString } from 'class-validator';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../env';

class VerifyPaystackDto {
  @IsString()
  reference!: string;
}

type RawBodyRequest = Request & { rawBody?: Buffer };

const getSignature = (value: string | string[] | undefined) => {
  if (!value) return '';
  return Array.isArray(value) ? value[0] : value;
};

const assertValidPaystackSignature = (signature: string | string[] | undefined, rawBody: Buffer) => {
  if (!env.paystackWebhookSecret) {
    throw new BadRequestException('Paystack webhook secret not configured');
  }
  const resolvedSignature = getSignature(signature);
  if (!resolvedSignature) {
    throw new BadRequestException('Missing Paystack signature');
  }
  const expected = createHmac('sha512', env.paystackWebhookSecret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(resolvedSignature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new BadRequestException('Invalid Paystack signature');
  }
};

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentsJobs: PaymentsJobsService
  ) {}

  @Post('paystack/verify')
  verifyPaystack(@Body() body: VerifyPaystackDto) {
    return this.paymentsService.verifyPaystack(body.reference);
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  async handlePaystackWebhook(
    @Req() req: RawBodyRequest,
    @Headers('x-paystack-signature') signature?: string | string[]
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    assertValidPaystackSignature(signature, rawBody);

    const payload = req.body || {};
    const eventType = typeof payload.event === 'string' ? payload.event : '';
    const reference = payload?.data?.reference;
    const isChargeEvent = eventType === 'charge.success' || eventType === 'charge.failed';
    if (reference && isChargeEvent) {
      await this.paymentsJobs.enqueuePaystackVerification(reference, payload);
    }

    return { received: true };
  }
}
