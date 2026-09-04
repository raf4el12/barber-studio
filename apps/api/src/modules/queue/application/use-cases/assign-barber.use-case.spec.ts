import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueueStatus, Role } from '@prisma/client';
import { AssignBarberUseCase } from './assign-barber.use-case';
import type { IQueueRepository } from '../../domain/repositories/queue.repository';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';
import type { QueueEntryEntity } from '../../domain/entities/queue-entry.entity';

function entry(overrides: Partial<QueueEntryEntity> = {}): QueueEntryEntity {
  return {
    id: 'entry-1',
    branchId: 'branch-1',
    status: QueueStatus.WAITING,
    position: null,
    customerId: null,
    customerName: 'Walk-in',
    customerPhone: null,
    assignedBarberId: null,
    createdAt: new Date('2026-06-01T10:00:00Z'),
    calledAt: null,
    closedAt: null,
    ...overrides,
  };
}

function user(overrides = {}) {
  return {
    id: 'barber-1',
    name: 'Barbero',
    email: 'barber@barber.studio',
    role: Role.BARBER,
    isActive: true,
    branchId: 'branch-1',
    commissionRate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function setup() {
  const repo = {
    findById: jest.fn().mockResolvedValue(entry()),
    assignBarber: jest
      .fn()
      .mockImplementation((id: string, barberId: string) =>
        Promise.resolve({ ...entry(), id, assignedBarberId: barberId }),
      ),
  };
  const users = { findById: jest.fn().mockResolvedValue(user()) };
  const events = { emitQueueUpdated: jest.fn().mockResolvedValue(undefined) };
  const useCase = new AssignBarberUseCase(
    repo as unknown as IQueueRepository,
    users as unknown as IUserRepository,
    events,
  );
  return { repo, users, events, useCase };
}

describe('AssignBarberUseCase', () => {
  it('asigna barbero existente y la entrada aparece en su cola', async () => {
    const { repo, events, useCase } = setup();
    const result = await useCase.execute('entry-1', 'barber-1', 'branch-1');
    expect(repo.assignBarber).toHaveBeenCalledWith('entry-1', 'barber-1');
    expect(result.assignedBarberId).toBe('barber-1');
    expect(events.emitQueueUpdated).toHaveBeenCalledWith('branch-1');
  });

  it('lanza NotFound cuando la entrada no existe', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', 'barber-1', 'branch-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza NotFound cuando el barbero no existe', async () => {
    const { users, useCase } = setup();
    users.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('entry-1', 'ghost', 'branch-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza asignar a un usuario que no es barbero', async () => {
    const { users, useCase } = setup();
    users.findById.mockResolvedValue(
      user({ id: 'cashier-1', role: Role.CASHIER }),
    );
    await expect(
      useCase.execute('entry-1', 'cashier-1', 'branch-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza entrada de otra sucursal con 403', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(entry({ branchId: 'branch-2' }));
    await expect(
      useCase.execute('entry-1', 'barber-1', 'branch-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
