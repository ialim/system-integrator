import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class PaymentsJobsService {
  constructor(@InjectQueue('payments') private readonly paymentsQueue: Queue) {}

  enqueuePaystackVerification(reference: string, event?: any) {
    if (!reference) return null;
    return this.paymentsQueue.add(
      'verify-paystack',
      { reference, event },
      {
        removeOnComplete: true,
        removeOnFail: 50
      }
    );
  }
}
