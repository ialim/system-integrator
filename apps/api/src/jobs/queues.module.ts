import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { env } from '../env';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: env.redisHost,
        port: env.redisPort,
        password: env.redisPassword || undefined
      }
    }),
    BullModule.registerQueue({
      name: 'payments'
    })
  ],
  exports: [BullModule]
})
export class QueuesModule {}
