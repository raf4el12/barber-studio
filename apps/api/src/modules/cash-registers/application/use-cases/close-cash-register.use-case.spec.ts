import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CloseCashRegisterUseCase } from './close-cash-register.use-case';
import type { ICashRegisterRepository } from '../../domain/repositories/cash-register.repository';

function register(overrides = {}) {
  return {
    id: 'reg-1',
    branchId: 'branch-1',
    openedById: 'user-1',
    openingAmount: 100,
    openedAt: new Date('2026-06-01T08:00:00Z'),
    closedById: null,
    closingCountedCash: null,
    closedAt: null,
    notes: null,
    ...overrides,
  };
}

describe('CloseCashRegisterUseCase', () => {
  function setup() {
    const repo = {
      findById: jest.fn().mockResolvedValue(register()),
      close: jest.fn(),
    };
    const useCase = new CloseCashRegisterUseCase(
      repo as unknown as ICashRegisterRepository,
    );
    return { repo, useCase };
  }

  it('cierra con arqueo de efectivo contado', async () => {
    const { repo, useCase } = setup();
    await useCase.execute('reg-1', { closingCountedCash: 540 }, 'user-2');
    expect(repo.close).toHaveBeenCalledWith('reg-1', {
      closedById: 'user-2',
      closingCountedCash: 540,
      notes: null,
    });
  });

  it('lanza NotFound cuando la caja no existe', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', { closingCountedCash: 0 }, 'user-2'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza cerrar una caja ya cerrada', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(
      register({ closedAt: new Date('2026-06-01T20:00:00Z') }),
    );
    await expect(
      useCase.execute('reg-1', { closingCountedCash: 0 }, 'user-2'),
    ).rejects.toThrow(BadRequestException);
    expect(repo.close).not.toHaveBeenCalled();
  });
});
