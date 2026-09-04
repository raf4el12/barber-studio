import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccrueLoyaltyUseCase, RedeemLoyaltyUseCase } from './loyalty.use-case';

function customer() {
  return {
    id: 'cust-1',
    name: 'Juan',
    phone: null,
    email: null,
    notes: null,
    loyaltyPoints: 5,
    isActive: true,
    branchId: 'branch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

function setup() {
  const repo = {
    findById: jest.fn().mockResolvedValue(customer()),
    addTransaction: jest.fn().mockImplementation((data: { points: number }) =>
      Promise.resolve({
        transaction: { id: 'tx-1', ...data, createdAt: new Date() },
        balance: 5 + data.points,
      }),
    ),
    getBalance: jest.fn().mockResolvedValue(5),
  };
  const settings = { execute: jest.fn().mockResolvedValue({ value: '10' }) };
  const audit = { execute: jest.fn().mockResolvedValue(undefined) };
  const accrue = new AccrueLoyaltyUseCase(repo as never, settings as never);
  const redeem = new RedeemLoyaltyUseCase(repo as never, audit as never);
  return { repo, settings, accrue, redeem, audit };
}

describe('AccrueLoyaltyUseCase', () => {
  it('ticket de S/50 con factor 10 → 5 puntos ligados al ticket', async () => {
    const { repo, accrue } = setup();
    const tx = (await accrue.execute({
      customerId: 'cust-1',
      total: 50,
      ticketId: 'ticket-1',
      ticketCode: 'T-001',
      branchId: 'branch-1',
    })) as { points: number; ticketId: string };
    expect(repo.addTransaction).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: 5,
      reason: 'Ticket T-001 pagado',
      ticketId: 'ticket-1',
    });
    expect(tx.points).toBe(5);
  });

  it('redondea hacia abajo (47.2 / 10 → 4)', async () => {
    const { repo, accrue } = setup();
    await accrue.execute({
      customerId: 'cust-1',
      total: 47.2,
      ticketId: 't',
      ticketCode: 'c',
    });
    expect(repo.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ points: 4 }),
    );
  });

  it('omite sin romper cuando falta el setting de factor', async () => {
    const { repo, settings, accrue } = setup();
    settings.execute.mockRejectedValue(new NotFoundException('no hay'));
    await expect(
      accrue.execute({
        customerId: 'cust-1',
        total: 50,
        ticketId: 't',
        ticketCode: 'c',
      }),
    ).resolves.toBeNull();
    expect(repo.addTransaction).not.toHaveBeenCalled();
  });

  it('omite cuando el cliente no existe', async () => {
    const { repo, accrue } = setup();
    repo.findById.mockResolvedValue(null);
    await expect(
      accrue.execute({
        customerId: 'ghost',
        total: 50,
        ticketId: 't',
        ticketCode: 'c',
      }),
    ).resolves.toBeNull();
  });
});

describe('RedeemLoyaltyUseCase', () => {
  it('canjea 5 puntos con motivo y audita con saldo posterior', async () => {
    const { repo, redeem, audit } = setup();
    repo.addTransaction.mockResolvedValue({
      transaction: { id: 'tx-1' },
      balance: 0,
    });
    await redeem.execute('cust-1', 5, 'Descuento cumpleaños', 'cashier-1');
    expect(repo.addTransaction).toHaveBeenCalledWith({
      customerId: 'cust-1',
      points: -5,
      reason: 'Descuento cumpleaños',
      ticketId: null,
    });
    expect(audit.execute).toHaveBeenCalledWith({
      userId: 'cashier-1',
      branchId: 'branch-1',
      action: 'LOYALTY_REDEEMED',
      entityType: 'Customer',
      entityId: 'cust-1',
      metadata: { points: 5, reason: 'Descuento cumpleaños', balanceAfter: 0 },
    });
  });

  it('canjear más del saldo → 400', async () => {
    const { repo, redeem } = setup();
    await expect(redeem.execute('cust-1', 6, 'Premio')).rejects.toThrow(
      BadRequestException,
    );
    expect(repo.addTransaction).not.toHaveBeenCalled();
  });

  it('rechaza puntos inválidos y motivo vacío', async () => {
    const { redeem } = setup();
    await expect(redeem.execute('cust-1', 0, 'x')).rejects.toThrow(
      BadRequestException,
    );
    await expect(redeem.execute('cust-1', 2.5, 'x')).rejects.toThrow(
      BadRequestException,
    );
    await expect(redeem.execute('cust-1', 2, '  ')).rejects.toThrow(
      BadRequestException,
    );
  });
});
