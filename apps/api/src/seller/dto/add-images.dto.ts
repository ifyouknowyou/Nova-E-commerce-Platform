import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class ProductImageInput {
  @IsString()
  @MaxLength(500)
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  alt?: string;
}

export class AddImagesDto {
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  images!: ProductImageInput[];
}
