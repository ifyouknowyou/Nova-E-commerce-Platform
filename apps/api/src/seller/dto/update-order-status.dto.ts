import { IsIn } from 'class-validator';

const SELLER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export class UpdateOrderStatusDto {
  @IsIn(SELLER_STATUSES)
  status!: (typeof SELLER_STATUSES)[number];
}