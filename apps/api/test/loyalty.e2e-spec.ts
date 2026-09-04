import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ItemType,
  Role,
  StockMovementType,
  TicketStatus,
} from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiEntity {
  id: string;
}

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('Fidelización (e2e)', () => {
  let app: INestApplication<App>;
  let ownerToken: string;
  let barberToken: string;
  let branchId: string;
  let serviceId: string;
  let productId: string;
  let customerId: string;
  let cashMethodId: string;
  let ticketId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.listen(0);
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

    await request(server)
      .put('/settings')
      .set(auth(ownerToken))
      .send({ key: 'loyalty_points_per_currency', value: '10' })
      .expect(200);

    const category = await request(server)
      .post('/service-categories')
      .set(auth(ownerToken))
      .send({ name: `E2E Loyalty Cat ${runId}` })
      .expect(201);
    const service = await request(server)
      .post('/services')
      .set(auth(ownerToken))
      .send({
        name: `E2E Loyalty Corte ${runId}`,
        price: 30,
        categoryId: (category.body as ApiEntity).id,
      })
      .expect(201);
    serviceId = (service.body as ApiEntity).id;

    const product = await request(server)
      .post('/products')
      .set(auth(ownerToken))
      .send({ name: `E2E Loyalty Cera ${runId}`, price: 10 })
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

    const customer = await request(server)
      .post('/customers')
      .set(auth(ownerToken))
      .send({ name: `E2E Cliente ${runId}`, branchId })
      .expect(201);
    customerId = (customer.body as ApiEntity).id;

    const barber = await request(server)
      .post('/users')
      .set(auth(ownerToken))
      .send({
        name: 'E2E Loyalty Barbero',
        email: `e2e-loyalty-${runId}@barber.studio`,
        password: 'password123',
        role: Role.BARBER,
        branchId,
      })
      .expect(201);
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
    await app.close();
  });

  it('pago con cliente acumula floor(47.2/10)=4 puntos', async () => {
    const server = app.getHttpServer();
    const ticket = await request(server)
      .post('/tickets')
      .set(auth(barberToken))
      .send({
        customerId,
        items: [
          { itemType: ItemType.SERVICE, serviceId, quantity: 1 },
          { itemType: ItemType.PRODUCT, productId, quantity: 1 },
        ],
      })
      .expect(201);
    ticketId = (ticket.body as ApiEntity).id;

    await request(server)
      .post(`/tickets/${ticketId}/payments`)
      .set(auth(ownerToken))
      .send({ paymentMethodId: cashMethodId, amount: 47.2 })
      .expect(201)
      .expect((res: { body: { status: TicketStatus } }) => {
        if (res.body.status !== TicketStatus.PAID) {
          throw new Error(`Estado esperado PAID, fue ${res.body.status}`);
        }
      });

    const loyalty = await request(server)
      .get(`/customers/${customerId}/loyalty`)
      .set(auth(ownerToken))
      .expect(200);
    const body = loyalty.body as {
      balance: number;
      ledger: { points: number; ticketId: string }[];
    };
    expect(body.balance).toBe(4);
    expect(body.ledger).toHaveLength(1);
    expect(body.ledger[0].points).toBe(4);
    expect(body.ledger[0].ticketId).toBe(ticketId);
  }, 30000);

  it('canje deja saldo en 0 y el sobrecanje da 400', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/customers/${customerId}/loyalty/redeem`)
      .set(auth(ownerToken))
      .send({ points: 4, reason: 'Descuento fiel' })
      .expect(201);

    const loyalty = await request(server)
      .get(`/customers/${customerId}/loyalty`)
      .set(auth(ownerToken))
      .expect(200);
    const body = loyalty.body as {
      balance: number;
      ledger: { points: number; runningBalance: number }[];
    };
    expect(body.balance).toBe(0);
    expect(body.ledger).toHaveLength(2);
    expect(body.ledger[1].points).toBe(-4);
    expect(body.ledger[1].runningBalance).toBe(0);

    await request(server)
      .post(`/customers/${customerId}/loyalty/redeem`)
      .set(auth(ownerToken))
      .send({ points: 1, reason: 'De más' })
      .expect(400);
  }, 30000);

  it('historial del cliente incluye el ticket y el void lo conserva', async () => {
    const server = app.getHttpServer();
    const history = await request(server)
      .get(`/customers/${customerId}/history`)
      .set(auth(ownerToken))
      .expect(200);
    expect((history.body as { id: string }[]).map((t) => t.id)).toContain(
      ticketId,
    );

    await request(server)
      .post(`/tickets/${ticketId}/void`)
      .set(auth(ownerToken))
      .expect(201);

    const afterVoid = await request(server)
      .get(`/customers/${customerId}/history`)
      .set(auth(ownerToken))
      .expect(200);
    expect((afterVoid.body as { id: string }[]).map((t) => t.id)).toContain(
      ticketId,
    );
  }, 30000);
});
