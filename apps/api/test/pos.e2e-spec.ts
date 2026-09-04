import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ItemType,
  QueueStatus,
  Role,
  StockMovementType,
  TicketStatus,
} from '@prisma/client';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiEntity {
  id: string;
}

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('POS punta a punta (e2e)', () => {
  let app: INestApplication<App>;
  let url: string;
  let ownerToken: string;
  let barberToken: string;
  let branchId: string;
  let serviceId: string;
  let productId: string;
  let cashMethodId: string;
  const sockets: Socket[] = [];
  const createdIds = { users: [] as string[], tickets: [] as string[] };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.listen(0);
    url = await app.getUrl();
    const server = app.getHttpServer();

    const login = await request(server)
      .post('/auth/login')
      .send({ email: 'owner@barber.studio', password: 'password123' })
      .expect(200);
    ownerToken = (login.body as { accessToken: string }).accessToken;
    const me = await request(server)
      .get('/auth/me')
      .set(auth(ownerToken))
      .expect(200);
    branchId = (me.body as { branchId: string }).branchId;
    const runId = Date.now().toString(36);

    const category = await request(server)
      .post('/service-categories')
      .set(auth(ownerToken))
      .send({ name: `E2E Corte ${runId}` })
      .expect(201);
    const service = await request(server)
      .post('/services')
      .set(auth(ownerToken))
      .send({
        name: `E2E Clásico ${runId}`,
        price: 30,
        categoryId: (category.body as ApiEntity).id,
      })
      .expect(201);
    serviceId = (service.body as ApiEntity).id;

    const product = await request(server)
      .post('/products')
      .set(auth(ownerToken))
      .send({ name: `E2E Cera ${runId}`, price: 10 })
      .expect(201);
    productId = (product.body as ApiEntity).id;
    await request(server)
      .post('/inventory/movements')
      .set(auth(ownerToken))
      .send({
        branchId,
        productId,
        type: StockMovementType.PURCHASE,
        quantity: 5,
      })
      .expect(201);

    const barber = await request(server)
      .post('/users')
      .set(auth(ownerToken))
      .send({
        name: 'E2E Barbero',
        email: `e2e-barber-${Date.now()}@barber.studio`,
        password: 'password123',
        role: Role.BARBER,
        branchId,
      })
      .expect(201);
    createdIds.users.push((barber.body as ApiEntity).id);
    const barberLogin = await request(server)
      .post('/auth/login')
      .send({
        email: (barber.body as { email: string }).email,
        password: 'password123',
      })
      .expect(200);
    barberToken = (barberLogin.body as { accessToken: string }).accessToken;

    const activeRegister = await request(server)
      .get(`/cash-registers/active?branchId=${branchId}`)
      .set(auth(ownerToken))
      .expect(200);
    if (!activeRegister.body || !(activeRegister.body as { id?: string }).id) {
      await request(server)
        .post('/cash-registers/open')
        .set(auth(ownerToken))
        .send({ branchId, openingAmount: 100 })
        .expect(201);
    }

    const methods = await request(server)
      .get('/payment-methods?isActive=true')
      .set(auth(ownerToken))
      .expect(200);
    cashMethodId = (
      (methods.body as { code: string; id: string }[]).find(
        (m) => m.code === 'CASH',
      ) ?? {
        id: '',
      }
    ).id;
    expect(cashMethodId).not.toBe('');
  }, 60000);

  afterAll(async () => {
    for (const socket of sockets) socket.disconnect();
    await app.close();
  });

  function connect(branch: string, token: string): Socket {
    const socket = io(url, {
      auth: { token },
      query: { branchId: branch },
      reconnection: false,
      timeout: 5000,
    });
    sockets.push(socket);
    return socket;
  }

  function waitFor<T>(
    socket: Socket,
    event: string,
    timeoutMs = 10000,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      socket.on(event, (payload: T) => resolve(payload));
      setTimeout(() => reject(new Error(`${event} timeout`)), timeoutMs);
    });
  }

  it('cola → ticket → pago dividido → PAID con stock y eventos WS', async () => {
    const server = app.getHttpServer();
    const socket = connect(branchId, ownerToken);
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (err: Error) => reject(err));
      setTimeout(() => reject(new Error('WS connect timeout')), 8000);
    });

    const ticketCreated = waitFor<{ ticket: { id: string } }>(
      socket,
      'ticket.created',
    );
    const ticketPaid = waitFor<{ ticket: { id: string } }>(
      socket,
      'ticket.paid',
    );

    const entry = await request(server)
      .post('/queue')
      .set(auth(barberToken))
      .send({ customerName: 'E2E Cliente' })
      .expect(201);
    const entryId = (entry.body as ApiEntity).id;
    const meBarber = await request(server)
      .get('/auth/me')
      .set(auth(barberToken))
      .expect(200);
    const barberId = (meBarber.body as { id: string }).id;
    await request(server)
      .patch(`/queue/${entryId}/assign`)
      .set(auth(barberToken))
      .send({ barberId })
      .expect(200);
    await request(server)
      .patch(`/queue/${entryId}/status`)
      .set(auth(barberToken))
      .send({ status: QueueStatus.IN_PROGRESS })
      .expect(200);

    const ticket = await request(server)
      .post('/tickets')
      .set(auth(barberToken))
      .send({
        queueEntryId: entryId,
        items: [
          { itemType: ItemType.SERVICE, serviceId, quantity: 1 },
          { itemType: ItemType.PRODUCT, productId, quantity: 1 },
        ],
      })
      .expect(201);
    const ticketBody = ticket.body as {
      id: string;
      total: number;
      status: TicketStatus;
    };
    createdIds.tickets.push(ticketBody.id);
    expect(ticketBody.total).toBe(47.2);

    const createdPayload = await ticketCreated;
    expect(createdPayload.ticket.id).toBe(ticketBody.id);

    await request(server)
      .post(`/tickets/${ticketBody.id}/payments`)
      .set(auth(ownerToken))
      .send({ paymentMethodId: cashMethodId, amount: 20 })
      .expect(201)
      .expect((res: { body: { status: TicketStatus } }) => {
        if (res.body.status !== TicketStatus.PARTIALLY_PAID) {
          throw new Error(
            `Estado esperado PARTIALLY_PAID, fue ${res.body.status}`,
          );
        }
      });

    await request(server)
      .post(`/tickets/${ticketBody.id}/payments`)
      .set(auth(ownerToken))
      .send({ paymentMethodId: cashMethodId, amount: 29.2, tipAmount: 2 })
      .expect(201)
      .expect((res: { body: { status: TicketStatus; tipAmount: number } }) => {
        if (res.body.status !== TicketStatus.PAID) {
          throw new Error(`Estado esperado PAID, fue ${res.body.status}`);
        }
        if (res.body.tipAmount !== 2) throw new Error('Propina no registrada');
      });

    const paidPayload = await ticketPaid;
    expect(paidPayload.ticket.id).toBe(ticketBody.id);

    const inventory = await request(server)
      .get(`/inventory?branchId=${branchId}`)
      .set(auth(ownerToken))
      .expect(200);
    const stock = (
      inventory.body as { productId: string; quantity: number }[]
    ).find((i) => i.productId === productId);
    expect(stock?.quantity).toBe(4);

    const performance = await request(server)
      .get('/me/performance')
      .set(auth(barberToken))
      .expect(200);
    const perf = performance.body as {
      completedServices: number;
      estimatedCommission: number;
    };
    expect(perf.completedServices).toBeGreaterThanOrEqual(1);
    expect(perf.estimatedCommission).toBe(16);

    await request(server)
      .post(`/tickets/${ticketBody.id}/void`)
      .set(auth(ownerToken))
      .expect(201)
      .expect((res: { body: { status: TicketStatus } }) => {
        if (res.body.status !== TicketStatus.VOIDED) {
          throw new Error(`Estado esperado VOIDED, fue ${res.body.status}`);
        }
      });

    const restored = await request(server)
      .get(`/inventory?branchId=${branchId}`)
      .set(auth(ownerToken))
      .expect(200);
    const stockAfter = (
      restored.body as { productId: string; quantity: number }[]
    ).find((i) => i.productId === productId);
    expect(stockAfter?.quantity).toBe(5);
  }, 60000);
});
