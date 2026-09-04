import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemType, Role } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiEntity {
  id: string;
}

function auth(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

describe('Seguridad y auditoría (e2e)', () => {
  let app: INestApplication<App>;
  let ownerToken: string;
  let ownerId: string;
  let barberToken: string;
  let cashierToken: string;
  let branchId: string;
  let otherBranchId: string;
  let ticketId: string;
  let ruleId: string;

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
    const runId = Date.now().toString(36);

    const login = await request(server)
      .post('/auth/login')
      .send({ email: 'owner@barber.studio', password: 'password123' })
      .expect(200);
    ownerToken = (login.body as { accessToken: string }).accessToken;
    const me = await request(server)
      .get('/auth/me')
      .set(auth(ownerToken))
      .expect(200);
    ownerId = (me.body as { id: string }).id;
    branchId = (me.body as { branchId: string }).branchId;

    const branch = await request(server)
      .post('/branches')
      .set(auth(ownerToken))
      .send({ name: `E2E Otra Sucursal ${runId}` })
      .expect(201);
    otherBranchId = (branch.body as ApiEntity).id;

    const barber = await request(server)
      .post('/users')
      .set(auth(ownerToken))
      .send({
        name: 'E2E Sec Barbero',
        email: `e2e-sec-${runId}@barber.studio`,
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

    const cashier = await request(server)
      .post('/users')
      .set(auth(ownerToken))
      .send({
        name: 'E2E Sec Cajero',
        email: `e2e-seccash-${runId}@barber.studio`,
        password: 'password123',
        role: Role.CASHIER,
        branchId,
      })
      .expect(201);
    const cashierLogin = await request(server)
      .post('/auth/login')
      .send({
        email: (cashier.body as { email: string }).email,
        password: 'password123',
      })
      .expect(200);
    cashierToken = (cashierLogin.body as { accessToken: string }).accessToken;
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  it('barbero leyendo otra sucursal → 403, la propia → 200', async () => {
    const server = app.getHttpServer();
    await request(server)
      .get(`/queue?branchId=${otherBranchId}`)
      .set(auth(barberToken))
      .expect(403);
    await request(server).get('/queue').set(auth(barberToken)).expect(200);
  }, 30000);

  it('cajero no puede consultar audit-logs → 403', async () => {
    const server = app.getHttpServer();
    await request(server)
      .get('/audit-logs')
      .set(auth(cashierToken))
      .expect(403);
  }, 30000);

  it('anular ticket deja TICKET_VOIDED con usuario y metadata', async () => {
    const server = app.getHttpServer();
    const runId = Date.now().toString(36);
    const category = await request(server)
      .post('/service-categories')
      .set(auth(ownerToken))
      .send({ name: `E2E Sec Cat ${runId}` })
      .expect(201);
    const service = await request(server)
      .post('/services')
      .set(auth(ownerToken))
      .send({
        name: `E2E Sec Corte ${runId}`,
        price: 30,
        categoryId: (category.body as ApiEntity).id,
      })
      .expect(201);
    const serviceId = (service.body as ApiEntity).id;

    const active = await request(server)
      .get(`/cash-registers/active?branchId=${branchId}`)
      .set(auth(ownerToken))
      .expect(200);
    if (!(active.body as { id?: string }).id) {
      await request(server)
        .post('/cash-registers/open')
        .set(auth(ownerToken))
        .send({ branchId, openingAmount: 50 })
        .expect(201);
    }
    const methods = await request(server)
      .get('/payment-methods?isActive=true')
      .set(auth(ownerToken))
      .expect(200);
    const cashId =
      (methods.body as { code: string; id: string }[]).find(
        (m) => m.code === 'CASH',
      )?.id ?? '';
    expect(cashId).not.toBe('');

    const ticket = await request(server)
      .post('/tickets')
      .set(auth(barberToken))
      .send({ items: [{ itemType: ItemType.SERVICE, serviceId }] })
      .expect(201);
    ticketId = (ticket.body as ApiEntity).id;
    await request(server)
      .post(`/tickets/${ticketId}/payments`)
      .set(auth(ownerToken))
      .send({ paymentMethodId: cashId, amount: 35.4 })
      .expect(201);
    await request(server)
      .post(`/tickets/${ticketId}/void`)
      .set(auth(ownerToken))
      .expect(201);

    const logs = await request(server)
      .get(`/audit-logs?action=TICKET_VOIDED&entityId=${ticketId}`)
      .set(auth(ownerToken))
      .expect(200);
    const body = logs.body as {
      total: number;
      data: {
        userId: string;
        metadata: { code: string; statusBefore: string };
      }[];
    };
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data[0].userId).toBe(ownerId);
    expect(body.data[0].metadata.statusBefore).toBe('PAID');
  }, 60000);

  it('cambiar % de comisión registra before/after', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/commission-rules')
      .set(auth(ownerToken))
      .send({ type: 'PERCENTAGE', value: 10 })
      .expect(201);
    ruleId = (created.body as ApiEntity).id;
    await request(server)
      .patch(`/commission-rules/${ruleId}`)
      .set(auth(ownerToken))
      .send({ value: 20 })
      .expect(200);

    const logs = await request(server)
      .get(`/audit-logs?action=COMMISSION_RULE_CHANGED&entityId=${ruleId}`)
      .set(auth(ownerToken))
      .expect(200);
    const entries = (
      logs.body as {
        data: {
          metadata: {
            operation: string;
            before?: { value: number };
            after?: { value: number };
          };
        }[];
      }
    ).data;
    const update = entries.find((e) => e.metadata.operation === 'update');
    expect(update?.metadata.before?.value).toBe(10);
    expect(update?.metadata.after?.value).toBe(20);

    await request(server)
      .delete(`/commission-rules/${ruleId}`)
      .set(auth(ownerToken))
      .expect(204);
  }, 60000);
});
