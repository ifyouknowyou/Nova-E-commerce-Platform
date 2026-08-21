import { IsOptional, IsString } from 'class-validator';

export class AssignProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brandId?: string;
}
