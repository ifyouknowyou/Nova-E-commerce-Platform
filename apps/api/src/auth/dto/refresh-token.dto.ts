import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(20, { message: 'Invalid refresh token' })
  refreshToken!: string;
}
