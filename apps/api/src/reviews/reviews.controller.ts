import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { parsePage, parsePageSize } from '../common/pagination';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import { Public } from '../rbac/decorators/public.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('products/:id/reviews')
  @Public()
  list(@Param('id') id: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.reviews.listForProduct(id, parsePage(page), parsePageSize(pageSize, 10));
  }

  @Post('products/:id/reviews')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    if (!user) throw new UnauthorizedException('Sign in to review products');
    return this.reviews.create(user.id, id, dto);
  }
}