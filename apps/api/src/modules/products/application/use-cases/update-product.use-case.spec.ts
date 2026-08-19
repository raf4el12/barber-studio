import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateProductUseCase } from './update-product.use-case';
import type { IProductRepository } from '../../domain/repositories/product.repository';

describe('UpdateProductUseCase', () => {
  let repo: jest.Mocked<
    Pick<IProductRepository, 'findById' | 'existsBySku' | 'update'>
  >;
  let useCase: UpdateProductUseCase;

  beforeEach(() => {
    repo = {
      findById: jest.fn().mockResolvedValue(null),
      existsBySku: jest.fn().mockResolvedValue(false),
      update: jest.fn(),
    };
    useCase = new UpdateProductUseCase(repo as unknown as IProductRepository);
  });

  it('throws NotFoundException when product does not exist', async () => {
    await expect(useCase.execute('p1', { price: 40 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ConflictException when updating to an already used SKU', async () => {
    repo.findById.mockResolvedValue({ id: 'p1', sku: 'OLD-SKU' } as any);
    repo.existsBySku.mockResolvedValue(true);
    await expect(useCase.execute('p1', { sku: 'TAKEN-SKU' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('updates product successfully', async () => {
    repo.findById.mockResolvedValue({ id: 'p1', sku: 'OLD-SKU' } as any);
    await useCase.execute('p1', { price: 45 });
    expect(repo.update).toHaveBeenCalledWith('p1', { price: 45 });
  });
});
