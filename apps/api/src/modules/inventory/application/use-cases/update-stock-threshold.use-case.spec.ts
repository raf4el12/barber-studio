import { UpdateStockThresholdUseCase } from './update-stock-threshold.use-case';
import type { IInventoryRepository } from '../../domain/repositories/inventory.repository';

describe('UpdateStockThresholdUseCase', () => {
  let repo: jest.Mocked<Pick<IInventoryRepository, 'updateThreshold'>>;
  let useCase: UpdateStockThresholdUseCase;

  beforeEach(() => {
    repo = { updateThreshold: jest.fn() };
    useCase = new UpdateStockThresholdUseCase(
      repo as unknown as IInventoryRepository,
    );
  });

  it('updates the low stock threshold for a product in a branch', async () => {
    await useCase.execute({ productId: 'p1', lowStockThreshold: 5 }, 'b1');
    expect(repo.updateThreshold).toHaveBeenCalledWith('b1', 'p1', 5);
  });
});
