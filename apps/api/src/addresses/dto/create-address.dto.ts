import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const ADDRESS_TYPES = ['SHIPPING', 'BILLING'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export class CreateAddressDto {
  @IsOptional()
  @IsIn(ADDRESS_TYPES)
  type?: AddressType;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @MaxLength(200)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  line2?: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @IsString()
  @MaxLength(100)
  country!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
