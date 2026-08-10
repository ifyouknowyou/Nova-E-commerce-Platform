import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AddressInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
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
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  saveAsDefault?: boolean;
}
