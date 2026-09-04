import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BranchScopeGuard } from './branch-scope.guard';
import type { AuthUser } from '../decorators/current-user.decorator';

function contextWith(user?: AuthUser, query = {}, body = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, query, body }),
    }),
  } as never;
}

function user(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    role: Role.CASHIER,
    branchId: 'branch-1',
    ...overrides,
  };
}

describe('BranchScopeGuard', () => {
  const guard = new BranchScopeGuard();

  it('OWNER pasa siempre, incluso con branch ajeno', () => {
    expect(
      guard.canActivate(
        contextWith(
          user({ role: Role.OWNER, branchId: null }),
          { branchId: 'other' },
          {},
        ),
      ),
    ).toBe(true);
  });

  it('no-OWNER con su propia sucursal pasa', () => {
    expect(
      guard.canActivate(contextWith(user(), { branchId: 'branch-1' }, {})),
    ).toBe(true);
  });

  it('no-OWNER sin branch explícito pasa (usa la del token)', () => {
    expect(guard.canActivate(contextWith(user(), {}, {}))).toBe(true);
  });

  it('no-OWNER con branch explícito ajeno → 403', () => {
    expect(() =>
      guard.canActivate(contextWith(user(), { branchId: 'other' }, {})),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(contextWith(user(), {}, { branchId: 'other' })),
    ).toThrow(ForbiddenException);
  });

  it('no-OWNER sin sucursal asignada → 403', () => {
    expect(() =>
      guard.canActivate(contextWith(user({ branchId: null }), {}, {})),
    ).toThrow(ForbiddenException);
  });

  it('sin usuario deja pasar (lo resuelve JwtAuthGuard)', () => {
    expect(guard.canActivate(contextWith(undefined, {}, {}))).toBe(true);
  });
});
