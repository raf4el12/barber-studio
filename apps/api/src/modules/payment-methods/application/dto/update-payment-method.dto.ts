import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
