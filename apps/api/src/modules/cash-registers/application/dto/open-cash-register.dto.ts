import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsNumber()
  @Min(0)
  openingAmount!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
