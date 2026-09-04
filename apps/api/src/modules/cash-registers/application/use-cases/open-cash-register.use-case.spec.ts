import { ConflictException } from '@nestjs/common';
import { OpenCashRegisterUseCase } from './open-cash-register.use-case';
import type { ICashRegisterRepository } from '../../domain/repositories/cash-register.repository';

describe('OpenCashRegisterUseCase', () => {
  function setup() {
    const repo = {
      findActive: jest.fn().mockResolvedValue(null),
      open: jest.fn(),
    };
    const useCase = new OpenCashRegisterUseCase(
      repo as unknown as ICashRegisterRepository,
    );
    return { repo, useCase };
  }

  it('abre caja con fondo inicial cuando no hay activa', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({ openingAmount: 100 }, 'branch-1', 'user-1');
    expect(repo.open).toHaveBeenCalledWith({
      branchId: 'branch-1',
      openedById: 'user-1',
      openingAmount: 100,
      notes: null,
    });
  });

  it('rechaza abrir cuando ya hay una caja activa en la sucursal', async () => {
    const { repo, useCase } = setup();
    repo.findActive.mockResolvedValue({ id: 'open-1' });
    await expect(
      useCase.execute({ openingAmount: 50 }, 'branch-1', 'user-1'),
    ).rejects.toThrow(ConflictException);
    expect(repo.open).not.toHaveBeenCalled();
  });
});
