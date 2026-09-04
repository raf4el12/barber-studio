import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../domain/repositories/queue.repository';
import {
  QUEUE_EVENTS,
  type IQueueEvents,
} from '../../domain/repositories/queue-events.repository';
import { CreateQueueEntryDto } from '../dto/create-queue-entry.dto';

@Injectable()
export class CreateQueueEntryUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    @Inject(QUEUE_EVENTS) private readonly events: IQueueEvents,
  ) {}

  async execute(dto: CreateQueueEntryDto, effectiveBranchId: string) {
    const branchId = dto.branchId ?? effectiveBranchId;
    if (!branchId) {
      throw new BadRequestException(
        'Se requiere especificar la sucursal (branchId)',
      );
    }
    if (!dto.customerId && !dto.customerName?.trim()) {
      throw new BadRequestException('Se requiere customerId o customerName');
    }
    const created = await this.queue.create({
      branchId,
      position: dto.position ?? null,
      customerId: dto.customerId ?? null,
      customerName: dto.customerName?.trim() ?? null,
      customerPhone: dto.customerPhone ?? null,
      assignedBarberId: dto.assignedBarberId ?? null,
    });
    await this.events.emitQueueUpdated(branchId);
    return created;
  }
}
