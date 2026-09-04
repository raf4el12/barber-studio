import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemType, Role, StockMovementType } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiEntity {
  id: string;
}

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('Cierre de día (e2e)', () => {
  let app: INestApplication<App>;
  let ownerToken: string;
  let barberToken: string;
  let branchId: string;
  let serviceId: string;
  let serviceName: string;
  let productId: string;
  let cashMethodId: string;
  let yapeMethodId: string;
  let registerId: string;
  const ticketIds: string[] = [];

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

    const category = await request(server)
      .post('/service-categories')
      .set(auth(ownerToken))
      .send({ name: `E2E Z Cat ${runId}` })
      .expect(201);
    serviceName = `E2E Z Corte ${runId}`;
    const service = await request(server)
      .post('/services')
      .set(auth(ownerToken))
      .send({
        name: serviceName,
        price: 30,
        categoryId: (category.body as ApiEntity).id,
      })
      .expect(201);
    serviceId = (service.body as ApiEntity).id;

    const product = await request(server)
      .post('/products')
      .set(auth(ownerToken))
      .send({ name: `E2E Z Cera ${runId}`, price: 10 })
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
        name: 'E2E Z Barbero',
        email: `e2e-z-${runId}@barber.studio`,
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
    if ((activeRegister.body as { id?: string }).id) {
      const activeId = (activeRegister.body as ApiEntity).id;
      await request(server)
        .post(`/cash-registers/${activeId}/close`)
        .set(auth(ownerToken))
        .send({ closingCountedCash: 0 })
        .expect(201);
    }
    const opened = await request(server)
      .post('/cash-registers/open')
      .set(auth(ownerToken))
      .send({ branchId, openingAmount: 100 })
      .expect(201);
    registerId = (opened.body as ApiEntity).id;

    const methods = await request(server)
      .get('/payment-methods?isActive=true')
      .set(auth(ownerToken))
      .expect(200);
    const list = methods.body as { code: string; id: string }[];
    cashMethodId = list.find((m) => m.code === 'CASH')?.id ?? '';
    yapeMethodId = list.find((m) => m.code === 'YAPE')?.id ?? '';
    expect(cashMethodId).not.toBe('');
    expect(yapeMethodId).not.toBe('');
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  async function createPaidTicket(
    items: { itemType: ItemType; serviceId?: string; productId?: string }[],
    payments: { paymentMethodId: string; amount: number; tipAmount?: number }[],
  ): Promise<string> {
    const server = app.getHttpServer();
    const ticket = await request(server)
      .post('/tickets')
      .set(auth(barberToken))
      .send({ items })
      .expect(201);
    const id = (ticket.body as ApiEntity).id;
    ticketIds.push(id);
    for (const payment of payments) {
      await request(server)
        .post(`/tickets/${id}/payments`)
        .set(auth(ownerToken))
        .send(payment)
        .expect(201);
    }
    return id;
  }

  it('ventas variadas → cierre con faltante → Z cuadra', async () => {
    const server = app.getHttpServer();
    await createPaidTicket(
      [{ itemType: ItemType.SERVICE, serviceId }],
      [{ paymentMethodId: cashMethodId, amount: 35.4 }],
    );
    await createPaidTicket(
      [{ itemType: ItemType.PRODUCT, productId }],
      [{ paymentMethodId: yapeMethodId, amount: 13.8, tipAmount: 2 }],
    );

    await request(server)
      .post(`/cash-registers/${registerId}/close`)
      .set(auth(ownerToken))
      .send({ closingCountedCash: 130 })
      .expect(201);

    const z = await request(server)
      .get(`/reports/z-report?cashRegisterId=${registerId}`)
      .set(auth(ownerToken))
      .expect(200);
    const report = z.body as {
      incomeByMethod: { methodCode: string; total: number; count: number }[];
      totals: {
        tickets: number;
        subtotal: number;
        discounts: number;
        tax: number;
        tips: number;
        revenue: number;
      };
      cash: { expected: number; counted: number; difference: number };
      payouts: {
        barberId: string;
        tickets: number;
        commission: number;
        tips: number;
        total: number;
      }[];
    };

    expect(report.incomeByMethod).toEqual([
      { methodCode: 'CASH', methodName: 'Efectivo', total: 35.4, count: 1 },
      { methodCode: 'YAPE', methodName: 'Yape', total: 13.8, count: 1 },
    ]);
    expect(report.totals).toEqual({
      tickets: 2,
      subtotal: 40,
      discounts: 0,
      tax: 7.2,
      tips: 2,
      revenue: 49.2,
    });
    expect(report.cash).toEqual({
      expected: 135.4,
      counted: 130,
      difference: -5.4,
    });
    expect(report.payouts).toHaveLength(1);
    expect(report.payouts[0]).toMatchObject({
      tickets: 2,
      commission: 16,
      tips: 2,
      total: 18,
    });
  }, 60000);

  it('payouts, métricas y Z por día responden', async () => {
    const server = app.getHttpServer();
    const dayZ = await request(server)
      .get(
        `/reports/z-report?branchId=${branchId}&date=${new Date().toISOString().slice(0, 10)}`,
      )
      .set(auth(ownerToken))
      .expect(200);
    expect((dayZ.body as { cash: null }).cash).toBeNull();

    const payoutRes = await request(server)
      .get(`/reports/barber-payouts?branchId=${branchId}`)
      .set(auth(ownerToken))
      .expect(200);
    expect(
      Array.isArray((payoutRes.body as { payouts: unknown[] }).payouts),
    ).toBe(true);

    const metrics = await request(server)
      .get(`/reports/metrics?branchId=${branchId}`)
      .set(auth(ownerToken))
      .expect(200);
    const body = metrics.body as {
      dailyVolume: { date: string; tickets: number }[];
      topServices: { serviceName: string }[];
    };
    expect(body.dailyVolume.length).toBeGreaterThanOrEqual(1);
    expect(body.topServices.map((s) => s.serviceName)).toContain(serviceName);
  }, 60000);

  it('anular excluye los tickets de todos los reportes', async () => {
    const server = app.getHttpServer();
    for (const id of ticketIds) {
      await request(server)
        .post(`/tickets/${id}/void`)
        .set(auth(ownerToken))
        .expect(201);
    }
    const afterVoid = await request(server)
      .get(`/reports/z-report?cashRegisterId=${registerId}`)
      .set(auth(ownerToken))
      .expect(200);
    expect(
      (afterVoid.body as { totals: { tickets: number } }).totals.tickets,
    ).toBe(0);
  }, 60000);
});
