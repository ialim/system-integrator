import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PaymentsService } from '../payments/payments.service';

type PaystackVerifyJob = { reference: string; event?: any };

@Processor('payments')
export class PaymentsProcessor extends WorkerHost {
  constructor(private readonly paymentsService: PaymentsService) {
    super();
  }

  async process(job: Job<PaystackVerifyJob>) {
    if (job.name !== 'verify-paystack') return;
    const { reference, event } = job.data || {};
    if (!reference) return;
    await this.paymentsService.verifyPaystack(reference, event ? { webhook: event } : undefined);
  }
}
