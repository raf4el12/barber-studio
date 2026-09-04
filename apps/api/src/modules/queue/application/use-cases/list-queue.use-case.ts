import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { QueueStatus } from '@prisma/client';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../domain/repositories/queue.repository';

@Injectable()
export class ListQueueUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
  ) {}

  async execute(
    branchId: string,
    status?: QueueStatus,
    assignedBarberId?: string,
  ) {
    if (!branchId) {
      throw new BadRequestException(
        'Se requiere especificar la sucursal (branchId)',
      );
    }
    return this.queue.findAll({ branchId, status, assignedBarberId });
  }
}
