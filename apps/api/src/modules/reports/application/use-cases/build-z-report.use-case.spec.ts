import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BuildZReportUseCase } from './build-z-report.use-case';

function register(overrides = {}) {
  return {
    id: 'reg-1',
    branchId: 'branch-1',
    openedById: 'user-1',
    openingAmount: 100,
    openedAt: new Date('2026-06-01T08:00:00Z'),
    closedById: 'user-2',
    closingCountedCash: 135,
    closedAt: new Date('2026-06-01T20:00:00Z'),
    notes: null,
    ...overrides,
  };
}

const payments = [
  {
    ticketId: 't1',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    methodCode: 'CASH',
    methodName: 'Efectivo',
    amount: 20,
    paidAt: new Date('2026-06-01T10:00:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    ticketId: 't1',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    methodCode: 'CASH',
    methodName: 'Efectivo',
    amount: 15.4,
    paidAt: new Date('2026-06-01T10:05:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    ticketId: 't2',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    methodCode: 'YAPE',
    methodName: 'Yape',
    amount: 11.8,
    paidAt: new Date('2026-06-01T11:00:00Z'),
    cashRegisterId: 'reg-1',
  },
];

const tickets = [
  {
    id: 't1',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    subtotal: 30,
    discountAmount: 0,
    taxAmount: 5.4,
    tipAmount: 0,
    total: 35.4,
    paidAt: new Date('2026-06-01T10:05:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    id: 't2',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    subtotal: 10,
    discountAmount: 0,
    taxAmount: 1.8,
    tipAmount: 2,
    total: 13.8,
    paidAt: new Date('2026-06-01T11:00:00Z'),
    cashRegisterId: 'reg-1',
  },
];

const items = [
  {
    ticketId: 't1',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    itemType: 'SERVICE' as const,
    serviceId: 'service-1',
    serviceName: 'Corte',
    quantity: 1,
    lineTotal: 35.4,
    commissionAmount: 12,
    paidAt: new Date('2026-06-01T10:05:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    ticketId: 't2',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    itemType: 'PRODUCT' as const,
    serviceId: null,
    serviceName: null,
    quantity: 1,
    lineTotal: 11.8,
    commissionAmount: 4,
    paidAt: new Date('2026-06-01T11:00:00Z'),
    cashRegisterId: 'reg-1',
  },
];

function setup() {
  const reports = {
    findPayments: jest.fn().mockResolvedValue(payments),
    findPaidTickets: jest.fn().mockResolvedValue(tickets),
    findPaidItems: jest.fn().mockResolvedValue(items),
  };
  const registers = { findById: jest.fn().mockResolvedValue(register()) };
  const useCase = new BuildZReportUseCase(reports as never, registers as never);
  return { reports, registers, useCase };
}

describe('BuildZReportUseCase por caja', () => {
  it('separa ingresos por método, cuadra arqueo y calcula payout', async () => {
    const { reports, useCase } = setup();
    const report = await useCase.execute({ cashRegisterId: 'reg-1' });

    expect(reports.findPayments).toHaveBeenCalledWith({
      kind: 'register',
      cashRegisterId: 'reg-1',
    });
    expect(report.incomeByMethod).toEqual([
      { methodCode: 'CASH', methodName: 'Efectivo', total: 35.4, count: 2 },
      { methodCode: 'YAPE', methodName: 'Yape', total: 11.8, count: 1 },
    ]);
    expect(report.totals).toEqual({
      tickets: 2,
      subtotal: 40,
      discounts: 0,
      tax: 7.2,
      tips: 2,
      revenue: 49.2,
    });
    expect(report.cash).toEqual({
      expected: 135.4,
      counted: 135,
      difference: -0.4,
    });
    expect(report.payouts).toEqual([
      {
        barberId: 'barber-1',
        barberName: 'Juan',
        tickets: 2,
        commission: 16,
        tips: 2,
        total: 18,
      },
    ]);
  });

  it('lanza NotFound cuando la caja no existe', async () => {
    const { registers, useCase } = setup();
    registers.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ cashRegisterId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('BuildZReportUseCase por día', () => {
  it('resuelve el rango del día y no incluye arqueo', async () => {
    const { reports, useCase } = setup();
    const report = await useCase.execute({
      branchId: 'branch-1',
      date: '2026-06-01',
    });
    expect(reports.findPayments).toHaveBeenCalledWith({
      kind: 'day',
      branchId: 'branch-1',
      from: new Date('2026-06-01T00:00:00.000Z'),
      to: new Date('2026-06-02T00:00:00.000Z'),
    });
    expect(report.cash).toBeNull();
    expect(report.register).toBeNull();
  });

  it('rechaza fecha inválida y sucursal ausente', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ branchId: 'branch-1', date: '01-06-2026' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      useCase.execute({ branchId: '', date: '2026-06-01' }),
    ).rejects.toThrow(BadRequestException);
  });
});
