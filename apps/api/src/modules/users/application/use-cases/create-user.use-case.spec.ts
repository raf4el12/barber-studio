import { ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CreateUserUseCase } from './create-user.use-case';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import type { IPasswordHasher } from '../../domain/contracts/password-hasher.interface';

describe('CreateUserUseCase', () => {
  let users: jest.Mocked<Pick<IUserRepository, 'existsByEmail' | 'create'>>;
  let hasher: jest.Mocked<IPasswordHasher>;
  let hashMock: jest.Mock;
  let useCase: CreateUserUseCase;

  const dto = {
    name: 'Barbero',
    email: 'b@x.com',
    password: 'password123',
    role: Role.BARBER,
    branchId: 'b1',
  };

  beforeEach(() => {
    users = {
      existsByEmail: jest.fn().mockResolvedValue(false),
      create: jest.fn(),
    };
    hashMock = jest.fn().mockResolvedValue('HASHED');
    hasher = {
      hash: hashMock,
      compare: jest.fn(),
    };
    useCase = new CreateUserUseCase(
      users as unknown as IUserRepository,
      hasher,
    );
  });

  it('rejects a duplicate email', async () => {
    users.existsByEmail.mockResolvedValue(true);
    await expect(useCase.execute(dto)).rejects.toThrow(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('hashes the password and never passes the plaintext to the repo', async () => {
    await useCase.execute(dto);
    expect(hashMock).toHaveBeenCalledWith('password123');
    expect(users.create).toHaveBeenCalledWith({
      name: 'Barbero',
      email: 'b@x.com',
      role: Role.BARBER,
      branchId: 'b1',
      passwordHash: 'HASHED',
    });
  });

  it('allows registration with an email previously used by a soft-deleted user', async () => {
    // existsByEmail returns false because softDeleteExtension filters out deletedAt != null
    users.existsByEmail.mockResolvedValue(false);
    await useCase.execute(dto);
    expect(users.create).toHaveBeenCalled();
  });
});
