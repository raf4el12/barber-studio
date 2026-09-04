import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../domain/repositories/queue.repository';
import {
  QUEUE_EVENTS,
  type IQueueEvents,
} from '../../domain/repositories/queue-events.repository';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/repositories/user.repository';

@Injectable()
export class AssignBarberUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(QUEUE_EVENTS) private readonly events: IQueueEvents,
  ) {}

  async execute(id: string, barberId: string, scopeBranchId?: string) {
    const current = await this.queue.findById(id);
    if (!current) {
      throw new NotFoundException(`Entrada de cola no encontrada: ${id}`);
    }
    if (scopeBranchId && current.branchId !== scopeBranchId) {
      throw new ForbiddenException('La entrada pertenece a otra sucursal');
    }
    const barber = await this.users.findById(barberId);
    if (!barber) {
      throw new NotFoundException(`Barbero no encontrado: ${barberId}`);
    }
    if (barber.role !== Role.BARBER) {
      throw new BadRequestException(
        'Solo un usuario con rol BARBER puede tomar la cola',
      );
    }
    const updated = await this.queue.assignBarber(id, barberId);
    await this.events.emitQueueUpdated(current.branchId);
    return updated;
  }
}
