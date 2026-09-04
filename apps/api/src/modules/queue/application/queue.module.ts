import { forwardRef, Module } from '@nestjs/common';
import { QUEUE_REPOSITORY } from '../domain/repositories/queue.repository';
import { QUEUE_EVENTS } from '../domain/repositories/queue-events.repository';
import { SHIFT_REPOSITORY } from '../domain/repositories/shift.repository';
import { PrismaQueueRepository } from '../infrastructure/persistence/prisma-queue.repository';
import { PrismaShiftRepository } from '../infrastructure/persistence/prisma-shift.repository';
import { QueueController } from '../interfaces/controllers/queue.controller';
import { MeController } from '../interfaces/controllers/me.controller';
import { QueueGateway } from '../interfaces/gateways/queue.gateway';
import { CreateQueueEntryUseCase } from './use-cases/create-queue-entry.use-case';
import { ListQueueUseCase } from './use-cases/list-queue.use-case';
import { AssignBarberUseCase } from './use-cases/assign-barber.use-case';
import { ChangeQueueStatusUseCase } from './use-cases/change-queue-status.use-case';
import { GetMyPerformanceUseCase } from './use-cases/get-my-performance.use-case';
import { AuthModule } from '../../../auth/auth.module';
import { UsersModule } from '../../users/application/users.module';
import { TicketsModule } from '../../tickets/application/tickets.module';

@Module({
  imports: [AuthModule, UsersModule, forwardRef(() => TicketsModule)],
  controllers: [QueueController, MeController],
  providers: [
    { provide: QUEUE_REPOSITORY, useClass: PrismaQueueRepository },
    { provide: SHIFT_REPOSITORY, useClass: PrismaShiftRepository },
    { provide: QUEUE_EVENTS, useExisting: QueueGateway },
    QueueGateway,
    CreateQueueEntryUseCase,
    ListQueueUseCase,
    AssignBarberUseCase,
    ChangeQueueStatusUseCase,
    GetMyPerformanceUseCase,
  ],
  exports: [QUEUE_REPOSITORY],
})
export class QueueModule {}
