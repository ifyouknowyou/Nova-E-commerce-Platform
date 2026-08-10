import { Matches } from 'class-validator';

export class VerifyEmailDto {
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit verification code' })
  code!: string;
}
