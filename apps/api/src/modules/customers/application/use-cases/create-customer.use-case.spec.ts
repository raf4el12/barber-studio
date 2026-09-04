import { ConflictException } from '@nestjs/common';
import { CreateCustomerUseCase } from './create-customer.use-case';

describe('CreateCustomerUseCase', () => {
  function setup() {
    const repo = {
      existsByEmail: jest.fn().mockResolvedValue(false),
      existsByPhone: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };
    const useCase = new CreateCustomerUseCase(repo as never);
    return { repo, useCase };
  }

  it('crea cliente normalizando vacíos a null', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({
      name: '  Juan Pérez  ',
      email: '',
      phone: undefined,
    });
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Juan Pérez',
      phone: null,
      email: null,
      notes: null,
      branchId: null,
      isActive: true,
    });
    expect(repo.existsByEmail).not.toHaveBeenCalled();
    expect(repo.existsByPhone).not.toHaveBeenCalled();
  });

  it('rechaza email duplicado', async () => {
    const { repo, useCase } = setup();
    repo.existsByEmail.mockResolvedValue(true);
    await expect(
      useCase.execute({ name: 'Juan', email: 'juan@mail.com' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rechaza teléfono duplicado', async () => {
    const { repo, useCase } = setup();
    repo.existsByPhone.mockResolvedValue(true);
    await expect(
      useCase.execute({ name: 'Juan', phone: '999' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
