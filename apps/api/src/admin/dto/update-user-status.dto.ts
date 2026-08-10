import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED', 'BANNED'])
  status!: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
}