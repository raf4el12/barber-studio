import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GetMyPerformanceUseCase } from './get-my-performance.use-case';
import type { IQueueRepository } from '../../domain/repositories/queue.repository';
import type { IUserRepository } from '../../../users/domain/repositories/user.repository';

function barber(overrides = {}) {
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
  const queue = { countCompletedByBarberSince: jest.fn().mockResolvedValue(7) };
  const shift = { findOpenRegister: jest.fn().mockResolvedValue(null) };
  const users = { findById: jest.fn().mockResolvedValue(barber()) };
  const tickets = {
    sumPaidCommissionsByBarberSince: jest.fn().mockResolvedValue(22),
  };
  const useCase = new GetMyPerformanceUseCase(
    queue as unknown as IQueueRepository,
    shift,
    users as unknown as IUserRepository,
    tickets as never,
  );
  return { queue, shift, users, tickets, useCase };
}

describe('GetMyPerformanceUseCase', () => {
  it('cuenta COMPLETED del barbero desde inicio del día sin caja abierta', async () => {
    const { queue, shift, useCase } = setup();
    const result = await useCase.execute('barber-1');
    expect(shift.findOpenRegister).toHaveBeenCalledWith('branch-1');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    expect(queue.countCompletedByBarberSince).toHaveBeenCalledWith(
      'barber-1',
      'branch-1',
      startOfDay,
    );
    expect(result).toEqual({
      barberId: 'barber-1',
      branchId: 'branch-1',
      shiftStartedAt: startOfDay,
      completedServices: 7,
      estimatedCommission: 22,
      commissionCurrency: 'PEN',
    });
  });

  it('usa la apertura de caja como inicio del turno cuando hay una activa', async () => {
    const openedAt = new Date('2026-06-01T08:00:00Z');
    const { queue, shift, useCase } = setup();
    shift.findOpenRegister.mockResolvedValue({ id: 'register-1', openedAt });
    const result = await useCase.execute('barber-1');
    expect(queue.countCompletedByBarberSince).toHaveBeenCalledWith(
      'barber-1',
      'branch-1',
      openedAt,
    );
    expect(result.shiftStartedAt).toEqual(openedAt);
    expect(result.completedServices).toBe(7);
  });

  it('lanza NotFound cuando el barbero no existe', async () => {
    const { users, useCase } = setup();
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute('ghost')).rejects.toThrow(NotFoundException);
  });

  it('rechaza sin sucursal efectiva', async () => {
    const { users, useCase } = setup();
    users.findById.mockResolvedValue(barber({ branchId: null }));
    await expect(useCase.execute('barber-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
