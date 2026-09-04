import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import { ApplyDiscountUseCase } from './apply-discount.use-case';
import type { TicketDetail } from '../../domain/entities/ticket.entity';

function detail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: 'ticket-1',
    code: 'T-20260601-AAAA',
    status: TicketStatus.OPEN,
    branchId: 'branch-1',
    barberId: 'barber-1',
    customerId: null,
    queueEntryId: null,
    subtotal: 40,
    discountAmount: 0,
    taxAmount: 7.2,
    tipAmount: 0,
    total: 47.2,
    createdAt: new Date(),
    paidAt: null,
    voidedAt: null,
    items: [],
    payments: [],
    amountPaid: 0,
    amountDue: 47.2,
    ...overrides,
  };
}

function setup(current: TicketDetail = detail()) {
  const tickets = {
    findById: jest.fn().mockResolvedValue(current),
    updateTicket: jest.fn().mockImplementation((_id: string, data: object) => {
      const next = { ...current, ...data };
      return Promise.resolve(next);
    }),
  };
  const events = { emitTicketUpdated: jest.fn().mockResolvedValue(undefined) };
  const useCase = new ApplyDiscountUseCase(tickets as never, events as never);
  return { tickets, events, useCase };
}

describe('ApplyDiscountUseCase', () => {
  it('aplica descuento manual y recalcula el total (40+7.2-5 = 42.2)', async () => {
    const { tickets, events, useCase } = setup();
    const result = await useCase.execute('ticket-1', 5, 'branch-1');
    expect(tickets.updateTicket).toHaveBeenCalledWith('ticket-1', {
      discountAmount: 5,
      total: 42.2,
    });
    expect(result.total).toBe(42.2);
    expect(events.emitTicketUpdated).toHaveBeenCalledWith(
      'branch-1',
      'ticket-1',
    );
  });

  it('lanza NotFound cuando el ticket no existe', async () => {
    const { tickets, useCase } = setup();
    tickets.findById.mockResolvedValue(null);
    await expect(useCase.execute('missing', 5, 'branch-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rechaza descuento en ticket no OPEN', async () => {
    const { tickets, useCase } = setup(detail({ status: TicketStatus.PAID }));
    await expect(useCase.execute('ticket-1', 5, 'branch-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(tickets.updateTicket).not.toHaveBeenCalled();
  });

  it('rechaza descuento mayor a subtotal + impuesto', async () => {
    const { tickets, useCase } = setup();
    await expect(useCase.execute('ticket-1', 100, 'branch-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(tickets.updateTicket).not.toHaveBeenCalled();
  });

  it('rechaza descuento negativo', async () => {
    const { useCase } = setup();
    await expect(useCase.execute('ticket-1', -1, 'branch-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
