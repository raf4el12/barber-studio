import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { AuthUser } from '../decorators/current-user.decorator';

const contextWith = (user?: AuthUser): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const makeGuard = (required: Role[] | undefined) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('allows when no roles are required', () => {
    const guard = makeGuard(undefined);
    expect(guard.canActivate(contextWith({ id: 'u', role: Role.BARBER, branchId: null }))).toBe(true);
  });

  it('allows when the user has a required role', () => {
    const guard = makeGuard([Role.OWNER]);
    expect(guard.canActivate(contextWith({ id: 'u', role: Role.OWNER, branchId: null }))).toBe(true);
  });

  it('denies when the user lacks the required role', () => {
    const guard = makeGuard([Role.OWNER]);
    expect(guard.canActivate(contextWith({ id: 'u', role: Role.BARBER, branchId: null }))).toBe(false);
  });

  it('denies when there is no user', () => {
    const guard = makeGuard([Role.OWNER]);
    expect(guard.canActivate(contextWith(undefined))).toBe(false);
  });
});
