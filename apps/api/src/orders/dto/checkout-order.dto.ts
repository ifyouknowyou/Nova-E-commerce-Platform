import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { AddressInputDto } from './address-input.dto';

export const SHIPPING_METHODS = ['standard', 'express'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export class CheckoutOrderDto {
  @ValidateNested()
  @Type(() => AddressInputDto)
  shipping!: AddressInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  billing?: AddressInputDto;

  @IsIn(SHIPPING_METHODS)
  shippingMethod!: ShippingMethod;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}