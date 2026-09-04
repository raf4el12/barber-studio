import { BadRequestException } from '@nestjs/common';
import {
  GetBarberPayoutsUseCase,
  GetMetricsUseCase,
} from './analytics.use-case';

const tickets = [
  {
    id: 't1',
    branchId: 'branch-1',
    barberId: 'barber-1',
    barberName: 'Juan',
    subtotal: 30,
    discountAmount: 0,
    taxAmount: 5.4,
    tipAmount: 3,
    total: 38.4,
    paidAt: new Date('2026-06-01T10:00:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    id: 't2',
    branchId: 'branch-1',
    barberId: 'barber-2',
    barberName: 'Pedro',
    subtotal: 60,
    discountAmount: 0,
    taxAmount: 10.8,
    tipAmount: 0,
    total: 70.8,
    paidAt: new Date('2026-06-02T10:00:00Z'),
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
    serviceId: 'service-corte',
    serviceName: 'Corte',
    quantity: 2,
    lineTotal: 70.8,
    commissionAmount: 12,
    paidAt: new Date('2026-06-01T10:00:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    ticketId: 't2',
    branchId: 'branch-1',
    barberId: 'barber-2',
    barberName: 'Pedro',
    itemType: 'SERVICE' as const,
    serviceId: 'service-barba',
    serviceName: 'Barba',
    quantity: 1,
    lineTotal: 35.4,
    commissionAmount: 20,
    paidAt: new Date('2026-06-02T10:00:00Z'),
    cashRegisterId: 'reg-1',
  },
  {
    ticketId: 't2',
    branchId: 'branch-1',
    barberId: 'barber-2',
    barberName: 'Pedro',
    itemType: 'PRODUCT' as const,
    serviceId: null,
    serviceName: null,
    quantity: 1,
    lineTotal: 35.4,
    commissionAmount: 5,
    paidAt: new Date('2026-06-02T10:00:00Z'),
    cashRegisterId: 'reg-1',
  },
];

function setup() {
  const reports = {
    findPaidTicketsInRange: jest.fn().mockResolvedValue(tickets),
    findPaidItemsInRange: jest.fn().mockResolvedValue(items),
  };
  return {
    reports,
    payouts: new GetBarberPayoutsUseCase(reports as never),
    metrics: new GetMetricsUseCase(reports as never),
  };
}

describe('GetBarberPayoutsUseCase', () => {
  it('payout por barbero = comisión congelada + propinas', async () => {
    const { reports, payouts } = setup();
    const result = await payouts.execute({
      branchId: 'branch-1',
      from: '2026-06-01',
      to: '2026-06-03',
    });
    expect(reports.findPaidTicketsInRange).toHaveBeenCalledWith({
      branchId: 'branch-1',
      from: new Date('2026-06-01T00:00:00.000Z'),
      to: new Date('2026-06-03T00:00:00.000Z'),
    });
    expect(result.payouts).toEqual([
      {
        barberId: 'barber-2',
        barberName: 'Pedro',
        tickets: 1,
        commission: 25,
        tips: 0,
        total: 25,
      },
      {
        barberId: 'barber-1',
        barberName: 'Juan',
        tickets: 1,
        commission: 12,
        tips: 3,
        total: 15,
      },
    ]);
    expect(result.totals).toEqual({ commission: 37, tips: 3 });
  });

  it('rechaza sin sucursal y con rango invertido', async () => {
    const { payouts } = setup();
    await expect(payouts.execute({})).rejects.toThrow(BadRequestException);
    await expect(
      payouts.execute({ branchId: 'b', from: '2026-06-03', to: '2026-06-01' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      payouts.execute({ branchId: 'b', from: 'no-fecha' }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('GetMetricsUseCase', () => {
  it('volumen diario, top barberos y top servicios', async () => {
    const { metrics } = setup();
    const result = await metrics.execute({ branchId: 'branch-1' });
    expect(result.dailyVolume).toEqual([
      { date: '2026-06-01', tickets: 1, revenue: 35.4 },
      { date: '2026-06-02', tickets: 1, revenue: 70.8 },
    ]);
    expect(result.topBarbers.map((b) => b.barberId)).toEqual([
      'barber-2',
      'barber-1',
    ]);
    expect(result.topServices).toEqual([
      {
        serviceId: 'service-corte',
        serviceName: 'Corte',
        quantity: 2,
        revenue: 70.8,
      },
      {
        serviceId: 'service-barba',
        serviceName: 'Barba',
        quantity: 1,
        revenue: 35.4,
      },
    ]);
  });
});
