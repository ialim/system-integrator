import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string
  ) {
    const limit = Math.min(Number(limitRaw) || 20, 100);
    const offset = Number(offsetRaw) || 0;
    const { items, total } = await this.productsService.list({ limit, offset, q, category, brand });
    return { items, limit, offset, total };
  }

  @Get(':sku')
  async bySku(@Param('sku') sku: string) {
    const product = await this.productsService.getBySku(sku);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
