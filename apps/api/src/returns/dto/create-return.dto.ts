import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateReturnDto {
  @IsUUID()
  orderItemId!: string;

  @IsString()
  @MaxLength(100)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Defaults to the order item's full value when omitted. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}
