import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../domain/repositories/queue.repository';
import {
  SHIFT_REPOSITORY,
  type IShiftRepository,
} from '../../domain/repositories/shift.repository';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../users/domain/repositories/user.repository';

export interface MyPerformance {
  barberId: string;
  branchId: string;
  shiftStartedAt: Date;
  completedServices: number;
  /** Placeholder hasta Fase 4: se conecta al CommissionResolverService. */
  estimatedCommission: number;
  commissionCurrency: string;
}

function startOfDay(at: Date): Date {
  const day = new Date(at);
  day.setHours(0, 0, 0, 0);
  return day;
}

@Injectable()
export class GetMyPerformanceUseCase {
  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    @Inject(SHIFT_REPOSITORY) private readonly shift: IShiftRepository,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(barberId: string, branchId?: string): Promise<MyPerformance> {
    const barber = await this.users.findById(barberId);
    if (!barber) {
      throw new NotFoundException(`Barbero no encontrado: ${barberId}`);
    }
    const effectiveBranch = branchId ?? barber.branchId;
    if (!effectiveBranch) {
      throw new BadRequestException(
        'Se requiere especificar la sucursal (branchId)',
      );
    }
    const openRegister = await this.shift.findOpenRegister(effectiveBranch);
    const shiftStartedAt = openRegister?.openedAt ?? startOfDay(new Date());
    const completedServices = await this.queue.countCompletedByBarberSince(
      barberId,
      effectiveBranch,
      shiftStartedAt,
    );
    return {
      barberId,
      branchId: effectiveBranch,
      shiftStartedAt,
      completedServices,
      estimatedCommission: 0,
      commissionCurrency: 'PEN',
    };
  }
}
