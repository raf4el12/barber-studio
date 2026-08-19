import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  NotEquals,
  Min,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class RegisterStockMovementDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsInt()
  @NotEquals(0)
  quantity!: number;

  @IsString()
  @IsOptional()
  reference?: string;
}

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
