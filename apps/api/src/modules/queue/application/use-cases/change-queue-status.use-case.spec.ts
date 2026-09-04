import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QueueStatus } from '@prisma/client';
import { ChangeQueueStatusUseCase } from './change-queue-status.use-case';
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

type UpdateStatusData = {
  status: QueueStatus;
  calledAt?: Date | null;
  closedAt?: Date | null;
};

function setup(current: QueueEntryEntity = entry()) {
  let saved: UpdateStatusData | undefined;
  const repo = {
    findById: jest.fn().mockResolvedValue(current),
    updateStatus: jest
      .fn()
      .mockImplementation((_id: string, data: UpdateStatusData) => {
        saved = data;
        return Promise.resolve({ ...current, ...data });
      }),
    saved: () => saved,
  };
  const events = { emitQueueUpdated: jest.fn().mockResolvedValue(undefined) };
  const useCase = new ChangeQueueStatusUseCase(
    repo as unknown as IQueueRepository,
    events,
  );
  return { repo, events, useCase };
}

describe('ChangeQueueStatusUseCase', () => {
  it('WAITING → IN_PROGRESS sella calledAt y emite', async () => {
    const { repo, events, useCase } = setup();
    await useCase.execute('entry-1', QueueStatus.IN_PROGRESS, 'branch-1');
    expect(repo.updateStatus).toHaveBeenCalledTimes(1);
    expect(repo.saved()?.status).toBe(QueueStatus.IN_PROGRESS);
    expect(repo.saved()?.calledAt).toBeInstanceOf(Date);
    expect(events.emitQueueUpdated).toHaveBeenCalledWith('branch-1');
  });

  it('IN_PROGRESS → COMPLETED sella closedAt', async () => {
    const { repo, useCase } = setup(entry({ status: QueueStatus.IN_PROGRESS }));
    await useCase.execute('entry-1', QueueStatus.COMPLETED, 'branch-1');
    expect(repo.updateStatus).toHaveBeenCalledTimes(1);
    expect(repo.saved()?.status).toBe(QueueStatus.COMPLETED);
    expect(repo.saved()?.closedAt).toBeInstanceOf(Date);
  });

  it('rechaza transición inválida (COMPLETED → WAITING) con 400', async () => {
    const { repo, events, useCase } = setup(
      entry({ status: QueueStatus.COMPLETED }),
    );
    await expect(
      useCase.execute('entry-1', QueueStatus.WAITING, 'branch-1'),
    ).rejects.toThrow(BadRequestException);
    expect(repo.updateStatus).not.toHaveBeenCalled();
    expect(events.emitQueueUpdated).not.toHaveBeenCalled();
  });

  it('lanza NotFound cuando la entrada no existe', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', QueueStatus.IN_PROGRESS, 'branch-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza entrada de otra sucursal con 403', async () => {
    const { useCase } = setup(entry({ branchId: 'branch-2' }));
    await expect(
      useCase.execute('entry-1', QueueStatus.IN_PROGRESS, 'branch-1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
