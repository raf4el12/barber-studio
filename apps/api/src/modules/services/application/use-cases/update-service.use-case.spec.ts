import { NotFoundException } from '@nestjs/common';
import { UpdateServiceUseCase } from './update-service.use-case';
import type { IServiceRepository } from '../../domain/repositories/service.repository';
import type { ServiceEntity } from '../../domain/entities/service.entity';

describe('UpdateServiceUseCase', () => {
  let repo: jest.Mocked<Pick<IServiceRepository, 'findById' | 'update'>>;
  let useCase: UpdateServiceUseCase;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    useCase = new UpdateServiceUseCase(repo as unknown as IServiceRepository);
  });

  it('throws NotFoundException when service is missing', async () => {
    await expect(useCase.execute('s1', { price: 50 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates service successfully', async () => {
    repo.findById.mockResolvedValue({
      id: 's1',
      name: 'Barba',
    } as unknown as ServiceEntity);
    await useCase.execute('s1', { price: 50 });
    expect(repo.update).toHaveBeenCalledWith('s1', { price: 50 });
  });
});
