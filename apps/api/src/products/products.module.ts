import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { dbProvider } from '../providers/db.provider';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, dbProvider]
})
export class ProductsModule {}
