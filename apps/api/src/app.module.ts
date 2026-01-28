import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectsModule } from './projects/projects.module';
import { OrdersModule } from './orders/orders.module';
import { SharesModule } from './shares/shares.module';
import { OrgModule } from './org/org.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [ProductsModule, AuthModule, ProjectsModule, OrdersModule, SharesModule, OrgModule, ClientsModule],
  controllers: [AppController],
  providers: [PrismaService]
})
export class AppModule {}
