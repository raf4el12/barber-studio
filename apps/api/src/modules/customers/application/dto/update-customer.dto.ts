import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string | null;

  @IsEmail()
  @IsOptional()
  email?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsString()
  @IsOptional()
  branchId?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
