import { Controller, Get } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { BrandsService, type PublicBrand } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  @Public()
  list(): Promise<PublicBrand[]> {
    return this.brands.list();
  }
}
