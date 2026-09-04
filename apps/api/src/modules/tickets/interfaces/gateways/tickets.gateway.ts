import { Inject, Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';
import type { ITicketEvents } from '../../domain/repositories/ticket-events.repository';
import { branchRoom } from '../../../../common/realtime/branch-room';

/**
 * Emite el estado del POS a la room de la sucursal.
 * No autentica conexiones: comparte el servidor con QueueGateway,
 * que ya une cada cliente a su room `branch:{branchId}`.
 */
@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class TicketsGateway implements ITicketEvents {
  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
  ) {}

  emitTicketCreated(branchId: string, ticketId: string): Promise<void> {
    return this.emit(branchId, ticketId, 'ticket.created');
  }

  emitTicketUpdated(branchId: string, ticketId: string): Promise<void> {
    return this.emit(branchId, ticketId, 'ticket.updated');
  }

  emitTicketPaid(branchId: string, ticketId: string): Promise<void> {
    return this.emit(branchId, ticketId, 'ticket.paid');
  }

  emitTicketVoided(branchId: string, ticketId: string): Promise<void> {
    return this.emit(branchId, ticketId, 'ticket.voided');
  }

  private async emit(
    branchId: string,
    ticketId: string,
    event: string,
  ): Promise<void> {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) return;
    this.server?.to(branchRoom(branchId)).emit(event, { ticket });
  }
}
