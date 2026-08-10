import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { COUPON_TYPE, type CouponType } from '@nova/shared';

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code!: string;

  @IsIn(COUPON_TYPE)
  type!: CouponType;

  /** Percentage (0–100) for PERCENTAGE, or fixed amount for FIXED. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  /** ISO-8601 datetime; the coupon becomes eligible at this point. */
  @IsOptional()
  @IsString()
  startsAt?: string;

  /** ISO-8601 datetime; the coupon stops being eligible at this point. */
  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
