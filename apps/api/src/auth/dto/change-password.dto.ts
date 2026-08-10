import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/[a-zA-Z]/, { message: 'Password must contain a letter' })
  @Matches(/\d/, { message: 'Password must contain a number' })
  newPassword!: string;
}
