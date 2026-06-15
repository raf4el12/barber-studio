import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  const findFirst = jest.fn();
  const signAsync = jest.fn().mockResolvedValue('signed.jwt.token');

  const prisma = { user: { findFirst } } as unknown as PrismaService;
  const jwt = { signAsync } as unknown as JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwt);
  });

  it('returns an access token with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret', 10);
    findFirst.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      passwordHash,
      role: Role.OWNER,
      branchId: 'b1',
    });

    const result = await service.login('a@b.com', 'secret');

    expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    expect(signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      role: Role.OWNER,
      branchId: 'b1',
    });
  });

  it('throws when the password is wrong', async () => {
    const passwordHash = await bcrypt.hash('secret', 10);
    findFirst.mockResolvedValue({
      id: 'u1',
      passwordHash,
      role: Role.BARBER,
      branchId: null,
    });

    await expect(service.login('a@b.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('throws when the user does not exist', async () => {
    findFirst.mockResolvedValue(null);

    await expect(service.login('x@y.com', 'whatever')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
