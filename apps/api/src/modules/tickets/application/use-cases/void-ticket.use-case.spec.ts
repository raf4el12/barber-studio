import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ItemType,
  CommissionType,
  TicketStatus,
  StockMovementType,
} from '@prisma/client';
import { VoidTicketUseCase } from './void-ticket.use-case';
import type { TicketDetail } from '../../domain/entities/ticket.entity';

function productItem() {
  return {
    id: 'item-2',
    ticketId: 'ticket-1',
    itemType: ItemType.PRODUCT,
    serviceId: null,
    productId: 'product-1',
    description: 'Cera',
    quantity: 2,
    unitPrice: 10,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 3.6,
    lineTotal: 23.6,
    commissionType: CommissionType.FIXED,
    commissionValue: 5,
    commissionAmount: 10,
  };
}

function serviceItem() {
  return {
    id: 'item-1',
    ticketId: 'ticket-1',
    itemType: ItemType.SERVICE,
    serviceId: 'service-1',
    productId: null,
    description: 'Corte',
    quantity: 1,
    unitPrice: 30,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 5.4,
    lineTotal: 35.4,
    commissionType: CommissionType.PERCENTAGE,
    commissionValue: 40,
    commissionAmount: 12,
  };
}

function detail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: 'ticket-1',
    code: 'T-20260601-AAAA',
    status: TicketStatus.PAID,
    branchId: 'branch-1',
    barberId: 'barber-1',
    customerId: null,
    queueEntryId: null,
    subtotal: 50,
    discountAmount: 0,
    taxAmount: 9,
    tipAmount: 0,
    total: 59,
    createdAt: new Date(),
    paidAt: new Date(),
    voidedAt: null,
    items: [serviceItem(), productItem()],
    payments: [],
    amountPaid: 59,
    amountDue: 0,
    ...overrides,
  };
}

function setup(current: TicketDetail = detail()) {
  const tickets = {
    findById: jest.fn().mockResolvedValue(current),
    updateTicket: jest
      .fn()
      .mockImplementation((_id: string, data: object) =>
        Promise.resolve({ ...current, ...data }),
      ),
  };
  const inventory = { registerMovement: jest.fn().mockResolvedValue({}) };
  const events = { emitTicketVoided: jest.fn().mockResolvedValue(undefined) };
  const useCase = new VoidTicketUseCase(
    tickets as never,
    inventory as never,
    events as never,
  );
  return { tickets, inventory, events, useCase };
}

describe('VoidTicketUseCase', () => {
  it('anula ticket OPEN sin mover stock', async () => {
    const { tickets, inventory, events, useCase } = setup(
      detail({
        status: TicketStatus.OPEN,
        paidAt: null,
        amountPaid: 0,
        amountDue: 59,
      }),
    );
    await useCase.execute('ticket-1', 'user-1', 'branch-1');
    expect(tickets.updateTicket).toHaveBeenCalledWith(
      'ticket-1',
      expect.objectContaining({ status: TicketStatus.VOIDED }),
    );
    expect(inventory.registerMovement).not.toHaveBeenCalled();
    expect(events.emitTicketVoided).toHaveBeenCalledWith(
      'branch-1',
      'ticket-1',
    );
  });

  it('anula ticket PAID revirtiendo stock solo de productos (RETURN x2)', async () => {
    const { inventory, useCase } = setup();
    await useCase.execute('ticket-1', 'user-1', 'branch-1');
    expect(inventory.registerMovement).toHaveBeenCalledTimes(1);
    expect(inventory.registerMovement).toHaveBeenCalledWith({
      branchId: 'branch-1',
      productId: 'product-1',
      type: StockMovementType.RETURN,
      quantity: 2,
      reference: 'T-20260601-AAAA',
      createdById: 'user-1',
    });
  });

  it('lanza NotFound cuando el ticket no existe', async () => {
    const { tickets, useCase } = setup();
    tickets.findById.mockResolvedValue(null);
    await expect(
      useCase.execute('missing', 'user-1', 'branch-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rechaza anular un ticket ya anulado', async () => {
    const { tickets, useCase } = setup(detail({ status: TicketStatus.VOIDED }));
    await expect(
      useCase.execute('ticket-1', 'user-1', 'branch-1'),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.updateTicket).not.toHaveBeenCalled();
  });
});
