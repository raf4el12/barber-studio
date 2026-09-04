import { ConflictException } from '@nestjs/common';
import { CreatePaymentMethodUseCase } from './create-payment-method.use-case';
import type { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository';

describe('CreatePaymentMethodUseCase', () => {
  let repo: jest.Mocked<
    Pick<IPaymentMethodRepository, 'findByCode' | 'create'>
  >;
  let useCase: CreatePaymentMethodUseCase;

  beforeEach(() => {
    repo = { findByCode: jest.fn().mockResolvedValue(null), create: jest.fn() };
    useCase = new CreatePaymentMethodUseCase(
      repo as unknown as IPaymentMethodRepository,
    );
  });

  it('normaliza el código a mayúsculas y crea activo', async () => {
    await useCase.execute({ code: ' tarjeta ', name: 'Tarjeta' });
    expect(repo.findByCode).toHaveBeenCalledWith('TARJETA');
    expect(repo.create).toHaveBeenCalledWith({
      code: 'TARJETA',
      name: 'Tarjeta',
      isActive: true,
      sortOrder: 0,
    });
  });

  it('rechaza código duplicado', async () => {
    repo.findByCode.mockResolvedValue({ id: 'x' } as never);
    await expect(
      useCase.execute({ code: 'CASH', name: 'Efectivo' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
