import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

/** Customer-facing validation: check eligibility against a cart subtotal. */
export class ValidateCouponDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal!: number;
}
