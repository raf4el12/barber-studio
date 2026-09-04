import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueueStatus } from '@prisma/client';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../domain/repositories/queue.repository';
import {
  QUEUE_EVENTS,
  type IQueueEvents,
} from '../../domain/repositories/queue-events.repository';
import { canTransition } from '../../domain/services/queue-transition.policy';

@Injectable()
export class ChangeQueueStatusUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    @Inject(QUEUE_EVENTS) private readonly events: IQueueEvents,
  ) {}

  async execute(id: string, to: QueueStatus, scopeBranchId?: string) {
    const current = await this.queue.findById(id);
    if (!current) {
      throw new NotFoundException(`Entrada de cola no encontrada: ${id}`);
    }
    if (scopeBranchId && current.branchId !== scopeBranchId) {
      throw new ForbiddenException('La entrada pertenece a otra sucursal');
    }
    if (!canTransition(current.status, to)) {
      throw new BadRequestException(
        `Transición inválida: ${current.status} → ${to}`,
      );
    }
    const now = new Date();
    const updated = await this.queue.updateStatus(id, {
      status: to,
      calledAt:
        to === QueueStatus.IN_PROGRESS
          ? (current.calledAt ?? now)
          : current.calledAt,
      closedAt:
        to === QueueStatus.COMPLETED || to === QueueStatus.CANCELLED
          ? (current.closedAt ?? now)
          : null,
    });
    await this.events.emitQueueUpdated(current.branchId);
    return updated;
  }
}
