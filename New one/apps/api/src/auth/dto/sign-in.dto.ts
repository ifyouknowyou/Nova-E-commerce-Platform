import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'admin@nexus.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'nexus-demo-password' })
  @IsString()
  @MinLength(8)
  password!: string;
}