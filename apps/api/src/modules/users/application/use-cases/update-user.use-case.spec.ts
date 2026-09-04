import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UpdateUserUseCase } from './update-user.use-case';

function user(overrides = {}) {
  return {
    id: 'user-1',
    name: 'Barbero',
    email: 'barber@barber.studio',
    role: Role.BARBER,
    isActive: true,
    branchId: 'branch-1',
    commissionRate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('UpdateUserUseCase', () => {
  function setup() {
    const repo = {
      findById: jest.fn().mockResolvedValue(user()),
      update: jest
        .fn()
        .mockImplementation((_id: string, data: object) =>
          Promise.resolve({ ...user(), ...data }),
        ),
    };
    const hasher = { hash: jest.fn().mockResolvedValue('hashed') };
    const audit = { execute: jest.fn().mockResolvedValue(undefined) };
    const useCase = new UpdateUserUseCase(
      repo as never,
      hasher as never,
      audit as never,
    );
    return { repo, audit, useCase };
  }

  it('lanza NotFound cuando no existe', async () => {
    const { repo, useCase } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', {})).rejects.toThrow(NotFoundException);
  });

  it('audita cambio de rol con before/after', async () => {
    const { audit, useCase } = setup();
    await useCase.execute('user-1', { role: Role.CASHIER }, 'owner-1');
    expect(audit.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
      branchId: 'branch-1',
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: 'user-1',
      metadata: {
        before: { role: Role.BARBER, branchId: 'branch-1' },
        after: { role: Role.CASHIER, branchId: 'branch-1' },
      },
    });
  });

  it('no audita cambios sin rol ni sucursal', async () => {
    const { audit, useCase } = setup();
    await useCase.execute('user-1', { name: 'Nuevo nombre' });
    expect(audit.execute).not.toHaveBeenCalled();
  });
});
