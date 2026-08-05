import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideReturnDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}