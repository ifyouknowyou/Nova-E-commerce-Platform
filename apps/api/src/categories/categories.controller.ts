import { Controller, Get } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { CategoriesService, type CategoryNode } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @Public()
  list(): Promise<CategoryNode[]> {
    return this.categories.list();
  }
}
