import { Module } from '@nestjs/common';
import { QueuesModule } from './queues.module';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentsProcessor } from './payments.processor';

@Module({
  imports: [QueuesModule, PaymentsModule],
  providers: [PaymentsProcessor]
})
export class JobsModule {}
