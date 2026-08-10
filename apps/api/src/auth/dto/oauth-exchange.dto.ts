import { IsString, MinLength } from 'class-validator';

export class OAuthExchangeDto {
  @IsString()
  @MinLength(20, { message: 'Invalid OAuth code' })
  code!: string;
}
