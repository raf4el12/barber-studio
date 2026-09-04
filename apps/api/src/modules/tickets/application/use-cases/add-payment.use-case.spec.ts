import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ItemType,
  CommissionType,
  TicketStatus,
  StockMovementType,
} from '@prisma/client';
import { AddPaymentUseCase } from './add-payment.use-case';
import type { TicketDetail } from '../../domain/entities/ticket.entity';

function productItem() {
  return {
    id: 'item-2',
    ticketId: 'ticket-1',
    itemType: ItemType.PRODUCT,
    serviceId: null,
    productId: 'product-1',
    description: 'Cera',
    quantity: 1,
    unitPrice: 10,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 1.8,
    lineTotal: 11.8,
    commissionType: CommissionType.FIXED,
    commissionValue: 5,
    commissionAmount: 5,
  };
}

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
    items: [productItem()],
    payments: [],
    amountPaid: 0,
    amountDue: 47.2,
    ...overrides,
  };
}

function method() {
  return {
    id: 'pm-cash',
    code: 'CASH',
    name: 'Efectivo',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function register() {
  return {
    id: 'reg-1',
    branchId: 'branch-1',
    openedById: 'cashier-1',
    openingAmount: 100,
    openedAt: new Date(),
    closedById: null,
    closingCountedCash: null,
    closedAt: null,
    notes: null,
  };
}

function setup(current: TicketDetail = detail()) {
  const tickets = {
    findById: jest.fn().mockResolvedValue(current),
    createPayment: jest
      .fn()
      .mockImplementation((data: object) =>
        Promise.resolve({ id: 'pay-1', createdAt: new Date(), ...data }),
      ),
    updateTicket: jest
      .fn()
      .mockImplementation((_id: string, data: object) =>
        Promise.resolve({ ...current, ...data }),
      ),
  };
  const methods = { findById: jest.fn().mockResolvedValue(method()) };
  const registers = { findActive: jest.fn().mockResolvedValue(register()) };
  const inventory = {
    findByBranchAndProduct: jest.fn().mockResolvedValue({ quantity: 10 }),
    registerMovement: jest.fn().mockResolvedValue({}),
  };
  const events = {
    emitTicketUpdated: jest.fn().mockResolvedValue(undefined),
    emitTicketPaid: jest.fn().mockResolvedValue(undefined),
  };
  const loyalty = { execute: jest.fn().mockResolvedValue(null) };
  const useCase = new AddPaymentUseCase(
    tickets as never,
    methods as never,
    registers as never,
    inventory as never,
    events as never,
    loyalty as never,
  );
  return { tickets, methods, registers, inventory, events, loyalty, useCase };
}

describe('AddPaymentUseCase', () => {
  it('cobra sin caja abierta → 400 sin crear pago', async () => {
    const { registers, tickets, useCase } = setup();
    registers.findActive.mockResolvedValue(null);
    await expect(
      useCase.execute(
        'ticket-1',
        { paymentMethodId: 'pm-cash', amount: 47.2 },
        'cashier-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createPayment).not.toHaveBeenCalled();
  });

  it('pago parcial S/20 de 47.2 → PARTIALLY_PAID sin mover stock', async () => {
    const { tickets, inventory, events, useCase } = setup();
    await useCase.execute(
      'ticket-1',
      { paymentMethodId: 'pm-cash', amount: 20 },
      'cashier-1',
    );
    expect(tickets.updateTicket).toHaveBeenCalledWith(
      'ticket-1',
      expect.objectContaining({ status: TicketStatus.PARTIALLY_PAID }),
    );
    expect(inventory.registerMovement).not.toHaveBeenCalled();
    expect(events.emitTicketUpdated).toHaveBeenCalledWith(
      'branch-1',
      'ticket-1',
    );
    expect(events.emitTicketPaid).not.toHaveBeenCalled();
  });

  it('pago que completa (20 + 27.2) → PAID con stock SALE y evento paid', async () => {
    const { tickets, inventory, events, useCase } = setup(
      detail({
        status: TicketStatus.PARTIALLY_PAID,
        amountPaid: 20,
        amountDue: 27.2,
      }),
    );
    await useCase.execute(
      'ticket-1',
      { paymentMethodId: 'pm-cash', amount: 27.2 },
      'cashier-1',
    );
    expect(tickets.updateTicket).toHaveBeenCalledWith(
      'ticket-1',
      expect.objectContaining({ status: TicketStatus.PAID }),
    );
    expect(inventory.registerMovement).toHaveBeenCalledWith({
      branchId: 'branch-1',
      productId: 'product-1',
      type: StockMovementType.SALE,
      quantity: -1,
      reference: 'T-20260601-AAAA',
      createdById: 'cashier-1',
    });
    expect(events.emitTicketPaid).toHaveBeenCalledWith('branch-1', 'ticket-1');
  });

  it('sobrepago → 400', async () => {
    const { tickets, useCase } = setup();
    await expect(
      useCase.execute(
        'ticket-1',
        { paymentMethodId: 'pm-cash', amount: 100 },
        'cashier-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createPayment).not.toHaveBeenCalled();
  });

  it('ticket ya PAID → 400', async () => {
    const { tickets, useCase } = setup(detail({ status: TicketStatus.PAID }));
    await expect(
      useCase.execute(
        'ticket-1',
        { paymentMethodId: 'pm-cash', amount: 1 },
        'cashier-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createPayment).not.toHaveBeenCalled();
  });

  it('método inactivo → 400', async () => {
    const { methods, tickets, useCase } = setup();
    methods.findById.mockResolvedValue({ ...method(), isActive: false });
    await expect(
      useCase.execute(
        'ticket-1',
        { paymentMethodId: 'pm-cash', amount: 10 },
        'cashier-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createPayment).not.toHaveBeenCalled();
  });

  it('lanza NotFound cuando el ticket no existe', async () => {
    const { tickets, useCase } = setup();
    tickets.findById.mockResolvedValue(null);
    await expect(
      useCase.execute(
        'missing',
        { paymentMethodId: 'pm-cash', amount: 10 },
        'cashier-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('al completar con customerId acumula puntos de fidelización', async () => {
    const { loyalty, useCase } = setup(
      detail({
        customerId: 'cust-1',
        status: TicketStatus.PARTIALLY_PAID,
        amountPaid: 47.19,
        amountDue: 0.01,
      }),
    );
    await useCase.execute(
      'ticket-1',
      { paymentMethodId: 'pm-cash', amount: 0.01 },
      'cashier-1',
    );
    expect(loyalty.execute).toHaveBeenCalledWith({
      customerId: 'cust-1',
      total: 47.2,
      ticketId: 'ticket-1',
      ticketCode: 'T-20260601-AAAA',
      branchId: 'branch-1',
    });
  });

  it('al completar sin customerId no acumula', async () => {
    const { loyalty, useCase } = setup(
      detail({
        status: TicketStatus.PARTIALLY_PAID,
        amountPaid: 20,
        amountDue: 27.2,
      }),
    );
    await useCase.execute(
      'ticket-1',
      { paymentMethodId: 'pm-cash', amount: 27.2 },
      'cashier-1',
    );
    expect(loyalty.execute).not.toHaveBeenCalled();
  });
});
