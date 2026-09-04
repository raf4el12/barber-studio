import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertSettingDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  /** Ausente o null = configuración global. */
  @IsString()
  @IsOptional()
  branchId?: string | null;
}
