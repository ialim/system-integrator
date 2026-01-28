import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../prisma/prisma.service';
import { QueuesModule } from '../jobs/queues.module';
import { PaymentsJobsService } from './payments.jobs.service';

@Module({
  imports: [QueuesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsJobsService, PrismaService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
