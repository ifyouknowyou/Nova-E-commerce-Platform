import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { ListProductsQueryDto } from '../products/dto/list-products.query.dto';
import { Public } from '../rbac/decorators/public.decorator';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly products: ProductsService,
  ) {}

  /** Full product search with the same filters/sorts as the catalog listing. */
  @Get('products')
  @Public()
  searchProducts(@Query() query: ListProductsQueryDto) {
    return this.products.list(query);
  }

  /** Autocomplete for the storefront search box. */
  @Get('suggestions')
  @Public()
  suggestions(@Query('q') q?: string) {
    return this.search.suggestions(q ?? '');
  }

  /** Trending search entry points. */
  @Get('popular')
  @Public()
  popular() {
    return this.search.popular();
  }
}
