import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateQueueEntryDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  assignedBarberId?: string;
}
