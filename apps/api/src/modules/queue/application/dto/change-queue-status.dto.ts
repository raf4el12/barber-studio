import { IsEnum } from 'class-validator';
import { QueueStatus } from '@prisma/client';

export class ChangeQueueStatusDto {
  @IsEnum(QueueStatus)
  status!: QueueStatus;
}
