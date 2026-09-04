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

export class UpdateCommissionRuleDto {
  @IsString()
  @IsOptional()
  name?: string | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsEnum(CommissionType)
  @IsOptional()
  type?: CommissionType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

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
