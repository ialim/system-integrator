import './env';
import { NestFactory } from '@nestjs/core';
import { JobsModule } from './jobs/jobs.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(JobsModule, {
    logger: ['log', 'error', 'warn']
  });
  await app.init();
}

bootstrap();
