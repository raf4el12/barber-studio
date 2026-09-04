import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @IsNumber()
  @Min(0)
  closingCountedCash!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
