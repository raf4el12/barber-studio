import { NotFoundException } from '@nestjs/common';
import { UpdateServiceCategoryUseCase } from './update-service-category.use-case';
import type { IServiceCategoryRepository } from '../../domain/repositories/service-category.repository';
import type { ServiceCategoryEntity } from '../../domain/entities/service-category.entity';

describe('UpdateServiceCategoryUseCase', () => {
  let repo: jest.Mocked<
    Pick<IServiceCategoryRepository, 'findById' | 'update'>
  >;
  let useCase: UpdateServiceCategoryUseCase;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };
    useCase = new UpdateServiceCategoryUseCase(
      repo as unknown as IServiceCategoryRepository,
    );
  });

  it('throws NotFoundException when category does not exist', async () => {
    await expect(useCase.execute('c1', { name: 'New' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates category when it exists', async () => {
    repo.findById.mockResolvedValue({
      id: 'c1',
      name: 'Old',
    } as unknown as ServiceCategoryEntity);
    await useCase.execute('c1', { name: 'New' });
    expect(repo.update).toHaveBeenCalledWith('c1', { name: 'New' });
  });
});
