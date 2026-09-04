import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateCustomerUseCase } from './update-customer.use-case';

function customer(overrides = {}) {
  return {
    id: 'cust-1',
    name: 'Juan',
    phone: null,
    email: null,
    notes: null,
    loyaltyPoints: 0,
    isActive: true,
    branchId: 'branch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('UpdateCustomerUseCase', () => {
  function setup() {
    const repo = {
      findById: jest.fn().mockResolvedValue(customer()),
      existsByEmail: jest.fn().mockResolvedValue(false),
      existsByPhone: jest.fn().mockResolvedValue(false),
      update: jest.fn(),
    };
    const useCase = new UpdateCustomerUseCase(repo as never);
    return { repo, useCase };
  }

  it('lanza NotFound cuando no existe', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', { name: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('valida email duplicado excluyendo al propio cliente', async () => {
    const { repo, useCase } = setup();
    await useCase.execute('cust-1', { email: 'nuevo@mail.com' });
    expect(repo.existsByEmail).toHaveBeenCalledWith('nuevo@mail.com', 'cust-1');
  });

  it('rechaza email duplicado de otro cliente', async () => {
    const { repo, useCase } = setup();
    repo.existsByEmail.mockResolvedValue(true);
    await expect(
      useCase.execute('cust-1', { email: 'otro@mail.com' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});
