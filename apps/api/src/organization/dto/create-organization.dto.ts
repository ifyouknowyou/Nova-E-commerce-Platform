import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { slugify } from '../../common/slugify';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  /** URL-safe slug; generated from name when omitted. */
  slug?: string;

  /** Apply the same slug normalization the store flow uses. */
  normalize(): void {
    if (!this.slug?.trim()) this.slug = slugify(this.name);
  }
}
