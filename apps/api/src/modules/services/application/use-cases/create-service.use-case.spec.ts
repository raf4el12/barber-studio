import { ConflictException } from '@nestjs/common';
import { CreateServiceUseCase } from './create-service.use-case';
import type { IServiceRepository } from '../../domain/repositories/service.repository';

describe('CreateServiceUseCase', () => {
  let repo: jest.Mocked<Pick<IServiceRepository, 'existsByName' | 'create'>>;
  let useCase: CreateServiceUseCase;

  beforeEach(() => {
    repo = {
      existsByName: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };
    useCase = new CreateServiceUseCase(repo as unknown as IServiceRepository);
  });

  it('rejects a duplicate service name', async () => {
    repo.existsByName.mockResolvedValue(true);
    await expect(
      useCase.execute({ name: 'Corte Clásico', price: 30 }),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a service successfully', async () => {
    const dto = { name: 'Corte Degradado', price: 35, durationMinutes: 40 };
    await useCase.execute(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });
});
