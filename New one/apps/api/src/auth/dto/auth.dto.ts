import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'admin@nexus.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'nexus-demo-password' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class SignUpDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'ada@nexus.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Correct-Horse-1' })
  @IsString()
  @MinLength(10)
  password!: string;

  @ApiProperty({ required: false, example: 'Ada Labs' })
  @IsOptional()
  @IsString()
  orgName?: string;

  @ApiProperty({ required: false, example: 'ada-labs' })
  @IsOptional()
  @IsString()
  orgSlug?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@nexus.local' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'New-Password-123' })
  @IsString()
  @MinLength(10)
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'New-Password-123' })
  @IsString()
  @MinLength(10)
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token!: string;
}
