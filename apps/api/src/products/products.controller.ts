import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @Public()
  list(@Query() query: ListProductsQueryDto) {
    return this.products.list(query);
  }

  @Get('featured')
  @Public()
  featured() {
    return this.products.featured();
  }

  @Get('best-sellers')
  @Public()
  bestSellers() {
    return this.products.bestSellers();
  }

  @Get(':idOrSlug')
  @Public()
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.products.findByIdOrSlug(idOrSlug);
  }
}
