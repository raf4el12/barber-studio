import { NotFoundException } from '@nestjs/common';
import { DeletePaymentMethodUseCase } from './delete-payment-method.use-case';
import type { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository';

function method(overrides = {}) {
  return {
    id: 'pm-1',
    code: 'TARJETA',
    name: 'Tarjeta',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DeletePaymentMethodUseCase', () => {
  function setup() {
    const repo = {
      findById: jest.fn().mockResolvedValue(method()),
      hasPayments: jest.fn().mockResolvedValue(false),
      update: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(method({ id, isActive: false })),
        ),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new DeletePaymentMethodUseCase(
      repo as unknown as IPaymentMethodRepository,
    );
    return { repo, useCase };
  }

  it('lanza NotFound cuando no existe', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });

  it('borra físico cuando no tiene pagos', async () => {
    const { repo, useCase } = setup();
    const result = await useCase.execute('pm-1');
    expect(repo.delete).toHaveBeenCalledWith('pm-1');
    expect(repo.update).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('desactiva en lugar de borrar cuando tiene pagos', async () => {
    const { repo, useCase } = setup();
    repo.hasPayments.mockResolvedValue(true);
    const result = await useCase.execute('pm-1');
    expect(repo.update).toHaveBeenCalledWith('pm-1', { isActive: false });
    expect(repo.delete).not.toHaveBeenCalled();
    expect(result?.isActive).toBe(false);
  });
});
