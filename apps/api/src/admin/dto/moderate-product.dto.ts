import { IsIn } from 'class-validator';

export class ModerateProductDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';
}