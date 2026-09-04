import { Inject, Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { QueueStatus, Role } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import {
  QUEUE_REPOSITORY,
  type IQueueRepository,
} from '../../domain/repositories/queue.repository';
import type { IQueueEvents } from '../../domain/repositories/queue-events.repository';
import type { JwtPayload } from '../../../../auth/jwt.strategy';

export const QUEUE_ROOM_PREFIX = 'branch:';

export function queueRoom(branchId: string): string {
  return `${QUEUE_ROOM_PREFIX}${branchId}`;
}

function unknownField(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

function extractToken(client: Socket): string | null {
  const fromAuth = unknownField(client.handshake.auth, 'token');
  if (typeof fromAuth === 'string' && fromAuth) return fromAuth;
  const header = unknownField(client.handshake.headers, 'authorization');
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  const fromQuery = unknownField(client.handshake.query, 'token');
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;
  return null;
}

/**
 * Gateway de cola en tiempo real. Los clientes se unen a la room
 * `branch:{branchId}` y reciben `queue.updated` tras cada mutación.
 * Implementa IQueueEvents: los use-cases notifican por el puerto,
 * sin conocer Socket.IO.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class QueueGateway
  implements OnGatewayConnection, OnGatewayDisconnect, IQueueEvents
{
  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(QUEUE_REPOSITORY) private readonly queue: IQueueRepository,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      client.disconnect(true);
      return;
    }
    const requested = unknownField(client.handshake.query, 'branchId');
    const branchId =
      payload.role === Role.OWNER && typeof requested === 'string' && requested
        ? requested
        : payload.branchId;
    if (!branchId) {
      client.disconnect(true);
      return;
    }
    const data = client.data as { branchId?: unknown; userId?: unknown };
    data.branchId = branchId;
    data.userId = payload.sub;
    await client.join(queueRoom(branchId));
  }

  handleDisconnect(client: Socket): void {
    const branchId = unknownField(client.data, 'branchId');
    if (typeof branchId === 'string' && branchId) {
      void client.leave(queueRoom(branchId));
    }
  }

  async emitQueueUpdated(branchId: string): Promise<void> {
    const entries = await this.queue.findAll({
      branchId,
      status: [QueueStatus.WAITING, QueueStatus.IN_PROGRESS],
    });
    this.server
      ?.to(queueRoom(branchId))
      .emit('queue.updated', { branchId, entries });
  }
}
