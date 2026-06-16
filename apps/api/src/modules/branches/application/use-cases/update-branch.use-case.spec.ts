import { NotFoundException } from '@nestjs/common';
import { UpdateBranchUseCase } from './update-branch.use-case';
import type { IBranchRepository } from '../../domain/repositories/branch.repository';

describe('UpdateBranchUseCase', () => {
  let repo: jest.Mocked<Pick<IBranchRepository, 'findById' | 'update'>>;
  let useCase: UpdateBranchUseCase;

  beforeEach(() => {
    repo = { findById: jest.fn(), update: jest.fn() };
    useCase = new UpdateBranchUseCase(repo as unknown as IBranchRepository);
  });

  it('throws NotFound when the branch does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates when the branch exists', async () => {
    repo.findById.mockResolvedValue({ id: 'b1' } as never);
    await useCase.execute('b1', { name: 'Nueva' });
    expect(repo.update).toHaveBeenCalledWith('b1', { name: 'Nueva' });
  });
});
