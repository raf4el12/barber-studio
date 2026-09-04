import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class AddPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tipAmount?: number;
}
