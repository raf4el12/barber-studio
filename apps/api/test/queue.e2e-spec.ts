import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueStatus } from '@prisma/client';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Queue realtime (e2e)', () => {
  let app: INestApplication<App>;
  let url: string;
  let token: string;
  let branchId: string;
  const sockets: Socket[] = [];

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

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@barber.studio', password: 'password123' })
      .expect(200);
    token = (login.body as { accessToken: string }).accessToken;

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    branchId = (me.body as { branchId: string }).branchId;
  }, 30000);

  afterAll(async () => {
    for (const socket of sockets) socket.disconnect();
    await app.close();
  });

  function connect(
    query: Record<string, string>,
    auth?: Record<string, string>,
  ): Socket {
    const socket = io(url, { auth, query, reconnection: false, timeout: 5000 });
    sockets.push(socket);
    return socket;
  }

  it('rechaza conexión WS sin token', async () => {
    const socket = connect({ branchId });
    const disconnected = await new Promise<boolean>((resolve) => {
      socket.on('disconnect', () => resolve(true));
      setTimeout(() => resolve(false), 4000);
    });
    expect(disconnected).toBe(true);
  }, 15000);

  it('POST /queue emite queue.updated a la room de la sucursal', async () => {
    const socket = connect({ branchId }, { token });
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (err) => reject(err));
      setTimeout(() => reject(new Error('WS connect timeout')), 8000);
    });

    const updated = new Promise<{
      branchId: string;
      entries: { id: string }[];
    }>((resolve, reject) => {
      socket.on(
        'queue.updated',
        (payload: { branchId: string; entries: { id: string }[] }) =>
          resolve(payload),
      );
      setTimeout(() => reject(new Error('queue.updated timeout')), 8000);
    });

    const created = await request(app.getHttpServer())
      .post('/queue')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerName: 'E2E Socket', branchId })
      .expect(201);

    const createdBody = created.body as { id: string };
    const payload = await updated;
    expect(payload.branchId).toBe(branchId);
    expect(payload.entries.map((e) => e.id)).toContain(createdBody.id);

    await request(app.getHttpServer())
      .patch(`/queue/${createdBody.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: QueueStatus.CANCELLED })
      .expect(200);
  }, 20000);
});
