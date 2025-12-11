import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [ProductsModule, AuthModule, ProjectsModule],
  controllers: [AppController],
  providers: [PrismaService]
})
export class AppModule {}
