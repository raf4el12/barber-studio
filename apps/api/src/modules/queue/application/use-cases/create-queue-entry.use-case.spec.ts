import { BadRequestException } from '@nestjs/common';
import { QueueStatus } from '@prisma/client';
import { CreateQueueEntryUseCase } from './create-queue-entry.use-case';
import type { IQueueRepository } from '../../domain/repositories/queue.repository';
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

function setup() {
  const repo = { create: jest.fn().mockResolvedValue(entry()) };
  const events = { emitQueueUpdated: jest.fn().mockResolvedValue(undefined) };
  const useCase = new CreateQueueEntryUseCase(
    repo as unknown as IQueueRepository,
    events,
  );
  return { repo, events, useCase };
}

describe('CreateQueueEntryUseCase', () => {
  it('crea en WAITING y emite queue.updated a la sucursal', async () => {
    const { repo, events, useCase } = setup();
    const result = await useCase.execute({ customerName: 'Juan' }, 'branch-1');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', customerName: 'Juan' }),
    );
    expect(events.emitQueueUpdated).toHaveBeenCalledWith('branch-1');
    expect(result.status).toBe(QueueStatus.WAITING);
  });

  it('usa el branchId del DTO cuando viene explícito', async () => {
    const { repo, events, useCase } = setup();
    await useCase.execute(
      { customerName: 'Juan', branchId: 'branch-2' },
      'branch-1',
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-2' }),
    );
    expect(events.emitQueueUpdated).toHaveBeenCalledWith('branch-2');
  });

  it('rechaza sin sucursal', async () => {
    const { repo, events, useCase } = setup();
    await expect(useCase.execute({ customerName: 'Juan' }, '')).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.create).not.toHaveBeenCalled();
    expect(events.emitQueueUpdated).not.toHaveBeenCalled();
  });

  it('rechaza sin identidad del cliente (ni customerId ni customerName)', async () => {
    const { useCase } = setup();
    await expect(useCase.execute({}, 'branch-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
