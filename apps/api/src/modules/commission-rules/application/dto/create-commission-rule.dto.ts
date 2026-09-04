import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreateCommissionRuleDto {
  @IsString()
  @IsOptional()
  name?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsEnum(CommissionType)
  type!: CommissionType;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  barberId?: string | null;

  @IsString()
  @IsOptional()
  serviceId?: string | null;

  @IsString()
  @IsOptional()
  serviceCategoryId?: string | null;

  @IsString()
  @IsOptional()
  productId?: string | null;

  @IsString()
  @IsOptional()
  branchId?: string | null;

  @IsDateString()
  @IsOptional()
  startsAt?: string | null;

  @IsDateString()
  @IsOptional()
  endsAt?: string | null;
}
