import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { IReportsRepository } from '../../domain/repositories/reports.repository';
import type {
  DateRange,
  ReportItemRow,
  ReportPaymentRow,
  ReportScope,
  ReportTicketRow,
} from '../../domain/interfaces/report-rows.interface';

type PaymentWithJoins = Prisma.PaymentGetPayload<{
  include: { paymentMethod: true; ticket: { include: { barber: true } } };
}>;

type ItemWithJoins = Prisma.TicketItemGetPayload<{
  include: { ticket: { include: { barber: true } }; service: true };
}>;

/**
 * Solo agrega tickets PAID no anulados: un ticket VOIDED no afecta
 * ningún total del reporte, aunque sus pagos sigan ligados a la caja.
 */
@Injectable()
export class PrismaReportsRepository implements IReportsRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  findPayments(scope: ReportScope): Promise<ReportPaymentRow[]> {
    return this.prisma.payment
      .findMany({
        where: { ...this.paymentScope(scope), ticket: { status: 'PAID' } },
        include: { paymentMethod: true, ticket: { include: { barber: true } } },
        orderBy: { createdAt: 'asc' },
      })
      .then((rows) => rows.map((r) => this.toPayment(r)));
  }

  async findPaidTickets(scope: ReportScope): Promise<ReportTicketRow[]> {
    if (scope.kind === 'register') {
      const ids = await this.paidTicketIds({
        cashRegisterId: scope.cashRegisterId,
      });
      if (ids.length === 0) return [];
      const rows = await this.prisma.ticket.findMany({
        where: { id: { in: ids } },
        include: { barber: true },
        orderBy: { paidAt: 'asc' },
      });
      return rows.map((r) => this.toTicket(r));
    }
    return this.findPaidTicketsInRange({
      branchId: scope.branchId,
      from: scope.from,
      to: scope.to,
    });
  }

  async findPaidItems(scope: ReportScope): Promise<ReportItemRow[]> {
    if (scope.kind === 'register') {
      const ids = await this.paidTicketIds({
        cashRegisterId: scope.cashRegisterId,
      });
      if (ids.length === 0) return [];
      return this.itemsOfTickets(ids);
    }
    return this.findPaidItemsInRange({
      branchId: scope.branchId,
      from: scope.from,
      to: scope.to,
    });
  }

  async findPaidTicketsInRange(range: DateRange): Promise<ReportTicketRow[]> {
    const rows = await this.prisma.ticket.findMany({
      where: {
        branchId: range.branchId,
        status: 'PAID',
        paidAt: { gte: range.from, lt: range.to },
      },
      include: { barber: true },
      orderBy: { paidAt: 'asc' },
    });
    return rows.map((r) => this.toTicket(r));
  }

  async findPaidItemsInRange(range: DateRange): Promise<ReportItemRow[]> {
    const rows = await this.prisma.ticketItem.findMany({
      where: {
        ticket: {
          branchId: range.branchId,
          status: 'PAID',
          paidAt: { gte: range.from, lt: range.to },
        },
      },
      include: { ticket: { include: { barber: true } }, service: true },
      orderBy: { ticket: { paidAt: 'asc' } },
    });
    return rows.map((r) => this.toItem(r));
  }

  private paymentScope(scope: ReportScope): Prisma.PaymentWhereInput {
    return scope.kind === 'register'
      ? { cashRegisterId: scope.cashRegisterId }
      : {
          ticket: {
            branchId: scope.branchId,
            paidAt: { gte: scope.from, lt: scope.to },
          },
        };
  }

  private async paidTicketIds(filter: {
    cashRegisterId: string;
  }): Promise<string[]> {
    const pays = await this.prisma.payment.findMany({
      where: { ...filter, ticket: { status: 'PAID' } },
      select: { ticketId: true },
    });
    return [...new Set(pays.map((p) => p.ticketId))];
  }

  private async itemsOfTickets(ticketIds: string[]): Promise<ReportItemRow[]> {
    const rows = await this.prisma.ticketItem.findMany({
      where: { ticketId: { in: ticketIds } },
      include: { ticket: { include: { barber: true } }, service: true },
    });
    return rows.map((r) => this.toItem(r));
  }

  private toPayment(row: PaymentWithJoins): ReportPaymentRow {
    return {
      ticketId: row.ticketId,
      branchId: row.ticket.branchId,
      barberId: row.ticket.barberId,
      barberName: row.ticket.barber.name,
      methodCode: row.paymentMethod.code,
      methodName: row.paymentMethod.name,
      amount: Number(row.amount),
      paidAt: row.createdAt,
      cashRegisterId: row.cashRegisterId,
    };
  }

  private toTicket(
    row: Prisma.TicketGetPayload<{ include: { barber: true } }>,
  ): ReportTicketRow {
    return {
      id: row.id,
      branchId: row.branchId,
      barberId: row.barberId,
      barberName: row.barber.name,
      subtotal: Number(row.subtotal),
      discountAmount: Number(row.discountAmount),
      taxAmount: Number(row.taxAmount),
      tipAmount: Number(row.tipAmount),
      total: Number(row.total),
      paidAt: row.paidAt ?? row.createdAt,
      cashRegisterId: null,
    };
  }

  private toItem(row: ItemWithJoins): ReportItemRow {
    return {
      ticketId: row.ticketId,
      branchId: row.ticket.branchId,
      barberId: row.ticket.barberId,
      barberName: row.ticket.barber.name,
      itemType: row.itemType,
      serviceId: row.serviceId,
      serviceName: row.service?.name ?? null,
      quantity: row.quantity,
      lineTotal: Number(row.lineTotal),
      commissionAmount: Number(row.commissionAmount),
      paidAt: row.ticket.paidAt ?? row.ticket.createdAt,
      cashRegisterId: null,
    };
  }
}
