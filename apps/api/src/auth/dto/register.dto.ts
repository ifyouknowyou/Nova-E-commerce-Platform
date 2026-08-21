import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'A valid email is required' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/[a-zA-Z]/, { message: 'Password must contain a letter' })
  @Matches(/\d/, { message: 'Password must contain a number' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  /** Account kind to create. Defaults to CUSTOMER when omitted. */
  @IsOptional()
  @IsIn(['CUSTOMER', 'SELLER'])
  accountType?: 'CUSTOMER' | 'SELLER';

  /** Required when accountType is SELLER — becomes the store's name/slug. */
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  storeName?: string;
}
