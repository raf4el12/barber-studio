import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemType } from '@prisma/client';

export class TicketItemInputDto {
  @IsEnum(ItemType)
  itemType!: ItemType;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class CreateTicketDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TicketItemInputDto)
  items!: TicketItemInputDto[];

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  queueEntryId?: string;
}
