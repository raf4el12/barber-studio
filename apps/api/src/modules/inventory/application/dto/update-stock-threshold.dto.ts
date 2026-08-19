import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockThresholdDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsInt()
  @Min(0)
  lowStockThreshold!: number;
}
