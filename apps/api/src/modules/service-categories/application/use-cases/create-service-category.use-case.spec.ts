import { ConflictException } from '@nestjs/common';
import { CreateServiceCategoryUseCase } from './create-service-category.use-case';
import type { IServiceCategoryRepository } from '../../domain/repositories/service-category.repository';

describe('CreateServiceCategoryUseCase', () => {
  let repo: jest.Mocked<
    Pick<IServiceCategoryRepository, 'existsByName' | 'create'>
  >;
  let useCase: CreateServiceCategoryUseCase;

  beforeEach(() => {
    repo = {
      existsByName: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };
    useCase = new CreateServiceCategoryUseCase(
      repo as unknown as IServiceCategoryRepository,
    );
  });

  it('rejects a duplicate category name', async () => {
    repo.existsByName.mockResolvedValue(true);
    await expect(useCase.execute({ name: 'Barba' })).rejects.toThrow(
      ConflictException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a service category successfully', async () => {
    const dto = { name: 'Cortes', sortOrder: 1 };
    await useCase.execute(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });
});
