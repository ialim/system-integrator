import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [ProductsModule, AuthModule],
  controllers: [AppController],
  providers: [PrismaService]
})
export class AppModule {}
