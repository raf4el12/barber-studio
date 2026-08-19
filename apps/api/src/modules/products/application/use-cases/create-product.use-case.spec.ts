import { ConflictException } from '@nestjs/common';
import { CreateProductUseCase } from './create-product.use-case';
import type { IProductRepository } from '../../domain/repositories/product.repository';

describe('CreateProductUseCase', () => {
  let repo: jest.Mocked<Pick<IProductRepository, 'existsBySku' | 'create'>>;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    repo = {
      existsBySku: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };
    useCase = new CreateProductUseCase(repo as unknown as IProductRepository);
  });

  it('rejects duplicate SKU when active product exists', async () => {
    repo.existsBySku.mockResolvedValue(true);
    await expect(
      useCase.execute({ name: 'Cera Mate', sku: 'SKU-001', price: 25 }),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates product when SKU is unique or omitted', async () => {
    const dto = { name: 'Pomada', price: 30 };
    await useCase.execute(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
  });
});
