import { WriteAuditLogUseCase } from './write-audit-log.use-case';

describe('WriteAuditLogUseCase', () => {
  function setup() {
    const repo = {
      write: jest
        .fn()
        .mockImplementation((data: object) => Promise.resolve(data)),
    };
    const useCase = new WriteAuditLogUseCase(repo as never);
    return { repo, useCase };
  }

  it('escribe el registro tal cual', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({
      userId: 'user-1',
      branchId: 'branch-1',
      action: 'TICKET_VOIDED',
      entityType: 'Ticket',
      entityId: 'ticket-1',
      metadata: { code: 'T-001', total: 47.2 },
    });
    expect(repo.write).toHaveBeenCalledWith({
      userId: 'user-1',
      branchId: 'branch-1',
      action: 'TICKET_VOIDED',
      entityType: 'Ticket',
      entityId: 'ticket-1',
      metadata: { code: 'T-001', total: 47.2 },
    });
  });

  it('sanitiza secretos del metadata (password, passwordHash, token)', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({
      action: 'USER_ROLE_CHANGED',
      entityId: 'user-9',
      metadata: {
        before: { role: 'BARBER' },
        after: {
          role: 'CASHIER',
          password: 'secreto',
          nested: { passwordHash: 'x' },
        },
        token: 'abc',
      },
    });
    expect(repo.write).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          before: { role: 'BARBER' },
          after: {
            role: 'CASHIER',
            password: '[redacted]',
            nested: { passwordHash: '[redacted]' },
          },
          token: '[redacted]',
        },
      }),
    );
  });

  it('normaliza ausentes a null', async () => {
    const { repo, useCase } = setup();
    await useCase.execute({ action: 'SETTING_CHANGED' });
    expect(repo.write).toHaveBeenCalledWith({
      userId: null,
      branchId: null,
      action: 'SETTING_CHANGED',
      entityType: null,
      entityId: null,
      metadata: null,
    });
  });
});
