import { BadRequestException } from '@nestjs/common';
import {
  CommissionType,
  ItemType,
  QueueStatus,
  Role,
  TicketStatus,
} from '@prisma/client';
import { CreateTicketUseCase } from './create-ticket.use-case';
import { CommissionResolverService } from '../../../commission-rules/application/services/commission-resolver.service';

function service() {
  return {
    id: 'service-1',
    name: 'Corte Clásico',
    description: null,
    price: 30,
    durationMinutes: 40,
    isActive: true,
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

function product(overrides = {}) {
  return {
    id: 'product-1',
    sku: 'CERA-01',
    name: 'Cera',
    description: null,
    price: 10,
    cost: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function barber() {
  return {
    id: 'barber-1',
    name: 'Barbero',
    email: 'barber@barber.studio',
    role: Role.BARBER,
    isActive: true,
    branchId: 'branch-1',
    commissionRate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

function queueEntry(overrides = {}) {
  return {
    id: 'entry-1',
    branchId: 'branch-1',
    status: QueueStatus.IN_PROGRESS,
    position: null,
    customerId: null,
    customerName: 'Juan',
    customerPhone: null,
    assignedBarberId: 'barber-1',
    createdAt: new Date(),
    calledAt: new Date(),
    closedAt: null,
    ...overrides,
  };
}

function setup() {
  const tickets = {
    createTicket: jest
      .fn()
      .mockImplementation((data: object) =>
        Promise.resolve({ id: 'ticket-1', status: TicketStatus.OPEN, ...data }),
      ),
  };
  const services = { findById: jest.fn().mockResolvedValue(service()) };
  const products = { findById: jest.fn().mockResolvedValue(product()) };
  const users = { findById: jest.fn().mockResolvedValue(barber()) };
  const rules = { findAll: jest.fn().mockResolvedValue([]) };
  const queue = {
    findById: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(undefined),
  };
  const settings = {
    execute: jest.fn().mockImplementation((key: string) => {
      if (key === 'tax_rate') return Promise.resolve({ value: '18' });
      return Promise.resolve({ value: '40' });
    }),
  };
  const events = {
    emitTicketCreated: jest.fn().mockResolvedValue(undefined),
    emitTicketUpdated: jest.fn().mockResolvedValue(undefined),
    emitTicketPaid: jest.fn().mockResolvedValue(undefined),
    emitTicketVoided: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new CreateTicketUseCase(
    tickets as never,
    services as never,
    products as never,
    users as never,
    rules as never,
    queue as never,
    settings as never,
    new CommissionResolverService(),
    events,
  );
  return {
    tickets,
    services,
    products,
    users,
    rules,
    queue,
    settings,
    events,
    useCase,
  };
}

const items = [
  { itemType: ItemType.SERVICE, serviceId: 'service-1', quantity: 1 },
  { itemType: ItemType.PRODUCT, productId: 'product-1', quantity: 1 },
];

describe('CreateTicketUseCase', () => {
  it('crea ticket OPEN con snapshots y totales del spec (30+10, IGV 18% → 47.2)', async () => {
    const { tickets, events, queue, useCase } = setup();
    const result = (await useCase.execute(
      { items },
      'barber-1',
      'branch-1',
    )) as {
      code: string;
      status: TicketStatus;
      subtotal: number;
      taxAmount: number;
      total: number;
      items: {
        description: string;
        unitPrice: number;
        taxAmount: number;
        lineTotal: number;
        commissionType: CommissionType;
        commissionValue: number;
        commissionAmount: number;
      }[];
    };

    expect(result.status).toBe(TicketStatus.OPEN);
    expect(result.code).toMatch(/^T-\d{8}-[A-Z0-9]{4}$/);
    expect(result.subtotal).toBe(40);
    expect(result.taxAmount).toBe(7.2);
    expect(result.total).toBe(47.2);

    const [serviceItem, productItem] = result.items;
    expect(serviceItem.description).toBe('Corte Clásico');
    expect(serviceItem.unitPrice).toBe(30);
    expect(serviceItem.taxAmount).toBe(5.4);
    expect(serviceItem.lineTotal).toBe(35.4);
    expect(serviceItem.commissionType).toBe(CommissionType.PERCENTAGE);
    expect(serviceItem.commissionValue).toBe(40);
    expect(serviceItem.commissionAmount).toBe(12);
    expect(productItem.lineTotal).toBe(11.8);

    expect(tickets.createTicket).toHaveBeenCalledTimes(1);
    expect(events.emitTicketCreated).toHaveBeenCalledWith(
      'branch-1',
      'ticket-1',
    );
    expect(queue.updateStatus).not.toHaveBeenCalled();
  });

  it('rechaza sin sucursal del barbero', async () => {
    const { tickets, useCase } = setup();
    await expect(useCase.execute({ items }, 'barber-1', '')).rejects.toThrow(
      BadRequestException,
    );
    expect(tickets.createTicket).not.toHaveBeenCalled();
  });

  it('rechaza ticket sin ítems', async () => {
    const { tickets, useCase } = setup();
    await expect(
      useCase.execute({ items: [] }, 'barber-1', 'branch-1'),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createTicket).not.toHaveBeenCalled();
  });

  it('rechaza producto inactivo', async () => {
    const { products, tickets, useCase } = setup();
    products.findById.mockResolvedValue(product({ isActive: false }));
    await expect(
      useCase.execute(
        {
          items: [
            { itemType: ItemType.PRODUCT, productId: 'product-1', quantity: 1 },
          ],
        },
        'barber-1',
        'branch-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createTicket).not.toHaveBeenCalled();
  });

  it('vincula y completa la entrada de cola IN_PROGRESS del barbero', async () => {
    const { queue, useCase } = setup();
    queue.findById.mockResolvedValue(queueEntry());
    await useCase.execute(
      { items, queueEntryId: 'entry-1' },
      'barber-1',
      'branch-1',
    );
    expect(queue.updateStatus).toHaveBeenCalledWith(
      'entry-1',
      expect.objectContaining({ status: QueueStatus.COMPLETED }),
    );
  });

  it('rechaza entrada de cola que no está IN_PROGRESS', async () => {
    const { queue, tickets, useCase } = setup();
    queue.findById.mockResolvedValue(
      queueEntry({ status: QueueStatus.COMPLETED }),
    );
    await expect(
      useCase.execute(
        { items, queueEntryId: 'entry-1' },
        'barber-1',
        'branch-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(tickets.createTicket).not.toHaveBeenCalled();
  });
});
