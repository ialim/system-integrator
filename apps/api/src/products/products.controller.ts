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
    @Query('brand') brand?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
    @Query('facet') facet?: string | string[]
  ) {
    const limit = Math.min(Number(limitRaw) || 20, 100);
    const offset = Number(offsetRaw) || 0;
    const facetValues = Array.isArray(facet) ? facet : facet ? [facet] : [];
    const facetFilters = facetValues
      .map((entry) => {
        const idx = entry.indexOf(':');
        if (idx <= 0) return null;
        return { key: entry.slice(0, idx), value: entry.slice(idx + 1) };
      })
      .filter((value): value is { key: string; value: string } => Boolean(value));
    const { items, total } = await this.productsService.list({
      limit,
      offset,
      q,
      category,
      brand,
      sort,
      dir,
      facetFilters
    });
    return { items, limit, offset, total };
  }

  @Get('/families')
  async listFamilies(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('facet') facet?: string | string[]
  ) {
    const facetValues = Array.isArray(facet) ? facet : facet ? [facet] : [];
    const facetFilters = facetValues
      .map((entry) => {
        const idx = entry.indexOf(':');
        if (idx <= 0) return null;
        return { key: entry.slice(0, idx), value: entry.slice(idx + 1) };
      })
      .filter((value): value is { key: string; value: string } => Boolean(value));
    const families = await this.productsService.listFamilies({ q, category, brand, facetFilters });
    return { items: families };
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
