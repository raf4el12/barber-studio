import { BadRequestException } from '@nestjs/common';
import { QueueStatus } from '@prisma/client';
import { ListQueueUseCase } from './list-queue.use-case';
import type { IQueueRepository } from '../../domain/repositories/queue.repository';

describe('ListQueueUseCase', () => {
  let repo: jest.Mocked<Pick<IQueueRepository, 'findAll'>>;
  let useCase: ListQueueUseCase;

  beforeEach(() => {
    repo = { findAll: jest.fn().mockResolvedValue([]) };
    useCase = new ListQueueUseCase(repo as unknown as IQueueRepository);
  });

  it('filtra por sucursal, estado y barbero asignado', async () => {
    await useCase.execute('branch-1', QueueStatus.WAITING, 'barber-1');
    expect(repo.findAll).toHaveBeenCalledWith({
      branchId: 'branch-1',
      status: QueueStatus.WAITING,
      assignedBarberId: 'barber-1',
    });
  });

  it('rechaza sin sucursal', async () => {
    await expect(useCase.execute('')).rejects.toThrow(BadRequestException);
    expect(repo.findAll).not.toHaveBeenCalled();
  });
});
