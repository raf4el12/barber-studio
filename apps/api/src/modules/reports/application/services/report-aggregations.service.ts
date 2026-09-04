import type {
  ReportItemRow,
  ReportPaymentRow,
  ReportTicketRow,
} from '../../domain/interfaces/report-rows.interface';

export interface IncomeByMethod {
  methodCode: string;
  methodName: string;
  total: number;
  count: number;
}

export interface BarberPayout {
  barberId: string;
  barberName: string;
  tickets: number;
  commission: number;
  tips: number;
  total: number;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function cashReconciliation(
  register: { openingAmount: number; closingCountedCash: number | null } | null,
  payments: ReportPaymentRow[],
) {
  if (!register) return null;
  const cashTotal = payments
    .filter((p) => p.methodCode === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);
  const expected = round2(register.openingAmount + cashTotal);
  const counted = register.closingCountedCash;
  return {
    expected,
    counted,
    difference: counted === null ? null : round2(counted - expected),
  };
}

export function incomeByMethod(payments: ReportPaymentRow[]): IncomeByMethod[] {
  const byMethod = new Map<string, IncomeByMethod>();
  for (const payment of payments) {
    const current = byMethod.get(payment.methodCode) ?? {
      methodCode: payment.methodCode,
      methodName: payment.methodName,
      total: 0,
      count: 0,
    };
    current.total = round2(current.total + payment.amount);
    current.count += 1;
    byMethod.set(payment.methodCode, current);
  }
  return [...byMethod.values()].sort((a, b) => b.total - a.total);
}

export function ticketTotals(paidTickets: ReportTicketRow[]) {
  const totals = {
    tickets: 0,
    subtotal: 0,
    discounts: 0,
    tax: 0,
    tips: 0,
    revenue: 0,
  };
  totals.tickets = paidTickets.length;
  for (const ticket of paidTickets) {
    totals.subtotal = round2(totals.subtotal + ticket.subtotal);
    totals.discounts = round2(totals.discounts + ticket.discountAmount);
    totals.tax = round2(totals.tax + ticket.taxAmount);
    totals.tips = round2(totals.tips + ticket.tipAmount);
  }
  totals.revenue = round2(
    totals.subtotal - totals.discounts + totals.tax + totals.tips,
  );
  return totals;
}

export function payouts(
  paidTickets: ReportTicketRow[],
  paidItems: ReportItemRow[],
): BarberPayout[] {
  const byBarber = new Map<string, BarberPayout & { ticketIds: Set<string> }>();
  for (const ticket of paidTickets) {
    const current = byBarber.get(ticket.barberId) ?? {
      barberId: ticket.barberId,
      barberName: ticket.barberName,
      tickets: 0,
      commission: 0,
      tips: 0,
      total: 0,
      ticketIds: new Set<string>(),
    };
    current.ticketIds.add(ticket.id);
    current.tips = round2(current.tips + ticket.tipAmount);
    byBarber.set(ticket.barberId, current);
  }
  for (const item of paidItems) {
    const current = byBarber.get(item.barberId) ?? {
      barberId: item.barberId,
      barberName: item.barberName,
      tickets: 0,
      commission: 0,
      tips: 0,
      total: 0,
      ticketIds: new Set<string>(),
    };
    current.commission = round2(current.commission + item.commissionAmount);
    byBarber.set(item.barberId, current);
  }
  return [...byBarber.values()]
    .map(({ ticketIds, ...payout }) => ({
      ...payout,
      tickets: ticketIds.size,
      total: round2(payout.commission + payout.tips),
    }))
    .sort((a, b) => b.total - a.total);
}

export interface DailyVolume {
  date: string;
  tickets: number;
  revenue: number;
}

export function dailyVolume(paidTickets: ReportTicketRow[]): DailyVolume[] {
  const byDay = new Map<string, DailyVolume>();
  for (const ticket of paidTickets) {
    const date = ticket.paidAt.toISOString().slice(0, 10);
    const current = byDay.get(date) ?? { date, tickets: 0, revenue: 0 };
    current.tickets += 1;
    current.revenue = round2(
      current.revenue +
        ticket.subtotal -
        ticket.discountAmount +
        ticket.taxAmount,
    );
    byDay.set(date, current);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  quantity: number;
  revenue: number;
}

export function topServices(
  paidItems: ReportItemRow[],
  limit = 10,
): TopService[] {
  const byService = new Map<string, TopService>();
  for (const item of paidItems) {
    if (item.itemType !== 'SERVICE' || !item.serviceId) continue;
    const current = byService.get(item.serviceId) ?? {
      serviceId: item.serviceId,
      serviceName: item.serviceName ?? item.serviceId,
      quantity: 0,
      revenue: 0,
    };
    current.quantity += item.quantity;
    current.revenue = round2(current.revenue + item.lineTotal);
    byService.set(item.serviceId, current);
  }
  return [...byService.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}
