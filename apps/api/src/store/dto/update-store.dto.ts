import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactEmail?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}