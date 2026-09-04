import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, Ticket, TicketItem } from '@prisma/client';
import {
  EXTENDED_PRISMA,
  type ExtendedPrismaService,
} from '../../../../prisma/prisma.service';
import type { ITicketRepository } from '../../domain/repositories/ticket.repository';
import type {
  CreatePaymentData,
  CreateTicketData,
  TicketFilters,
  UpdateTicketData,
} from '../../domain/interfaces/ticket-data.interface';
import {
  PaymentEntity,
  TicketDetail,
  TicketEntity,
  TicketItemEntity,
} from '../../domain/entities/ticket.entity';

type PaymentRow = Prisma.PaymentGetPayload<{
  include: { paymentMethod: true };
}>;
type DetailRow = Prisma.TicketGetPayload<{
  include: { items: true; payments: { include: { paymentMethod: true } } };
}>;

@Injectable()
export class PrismaTicketRepository implements ITicketRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async createTicket(data: CreateTicketData): Promise<TicketDetail> {
    const { items, ...ticket } = data;
    const created = await this.prisma.ticket.create({
      data: { ...ticket, items: { create: items } },
    });
    const detail = await this.findById(created.id);
    if (!detail)
      throw new Error(`Ticket recién creado no encontrado: ${created.id}`);
    return detail;
  }

  async findAll(filters: TicketFilters): Promise<TicketEntity[]> {
    const rows = await this.prisma.ticket.findMany({
      where: {
        ...(filters.branchId !== undefined && { branchId: filters.branchId }),
        ...(filters.status !== undefined && { status: filters.status }),
        ...(filters.barberId !== undefined && { barberId: filters.barberId }),
        ...(filters.customerId !== undefined && {
          customerId: filters.customerId,
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<TicketDetail | null> {
    const row = await this.prisma.ticket.findUnique({
      where: { id },
      include: { items: true, payments: { include: { paymentMethod: true } } },
    });
    return row ? this.toDetail(row) : null;
  }

  async createPayment(data: CreatePaymentData): Promise<PaymentEntity> {
    const row = await this.prisma.payment.create({
      data,
      include: { paymentMethod: true },
    });
    return this.toPayment(row);
  }

  async updateTicket(
    id: string,
    data: UpdateTicketData,
  ): Promise<TicketDetail> {
    await this.prisma.ticket.update({ where: { id }, data });
    const detail = await this.findById(id);
    if (!detail) throw new Error(`Ticket actualizado no encontrado: ${id}`);
    return detail;
  }

  async sumPaidCommissionsByBarberSince(
    barberId: string,
    branchId: string,
    since: Date,
  ): Promise<number> {
    const aggregate = await this.prisma.ticketItem.aggregate({
      _sum: { commissionAmount: true },
      where: {
        ticket: { barberId, branchId, status: 'PAID', paidAt: { gte: since } },
      },
    });
    return Number(aggregate._sum.commissionAmount ?? 0);
  }

  private toEntity(row: Ticket): TicketEntity {
    return {
      id: row.id,
      code: row.code,
      status: row.status,
      branchId: row.branchId,
      barberId: row.barberId,
      customerId: row.customerId,
      queueEntryId: row.queueEntryId,
      subtotal: Number(row.subtotal),
      discountAmount: Number(row.discountAmount),
      taxAmount: Number(row.taxAmount),
      tipAmount: Number(row.tipAmount),
      total: Number(row.total),
      createdAt: row.createdAt,
      paidAt: row.paidAt,
      voidedAt: row.voidedAt,
    };
  }

  private toItem(row: TicketItem): TicketItemEntity {
    return {
      id: row.id,
      ticketId: row.ticketId,
      itemType: row.itemType,
      serviceId: row.serviceId,
      productId: row.productId,
      description: row.description,
      quantity: row.quantity,
      unitPrice: Number(row.unitPrice),
      discountAmount: Number(row.discountAmount),
      taxRate: Number(row.taxRate),
      taxAmount: Number(row.taxAmount),
      lineTotal: Number(row.lineTotal),
      commissionType: row.commissionType,
      commissionValue: Number(row.commissionValue),
      commissionAmount: Number(row.commissionAmount),
    };
  }

  private toPayment(row: PaymentRow): PaymentEntity {
    return {
      id: row.id,
      ticketId: row.ticketId,
      paymentMethodId: row.paymentMethodId,
      methodCode: row.paymentMethod.code,
      methodName: row.paymentMethod.name,
      amount: Number(row.amount),
      cashierId: row.cashierId,
      cashRegisterId: row.cashRegisterId,
      createdAt: row.createdAt,
    };
  }

  private toDetail(row: DetailRow): TicketDetail {
    const entity = this.toEntity(row);
    const payments = row.payments.map((p) => this.toPayment(p));
    const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const detail = new TicketDetail();
    Object.assign(detail, entity, {
      items: row.items.map((i) => this.toItem(i)),
      payments,
      amountPaid: Math.round(amountPaid * 100) / 100,
      amountDue:
        Math.round((entity.total + entity.tipAmount - amountPaid) * 100) / 100,
    });
    return detail;
  }
}
