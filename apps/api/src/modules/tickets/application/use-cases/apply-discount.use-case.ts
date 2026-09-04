import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus } from '@prisma/client';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';
import {
  TICKET_EVENTS,
  type ITicketEvents,
} from '../../domain/repositories/ticket-events.repository';
import { roundMoney } from '../services/ticket-totals.service';

@Injectable()
export class ApplyDiscountUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
    @Inject(TICKET_EVENTS) private readonly events: ITicketEvents,
  ) {}

  async execute(
    ticketId: string,
    discountAmount: number,
    scopeBranchId?: string,
  ) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket no encontrado: ${ticketId}`);
    }
    if (scopeBranchId && ticket.branchId !== scopeBranchId) {
      throw new ForbiddenException('El ticket pertenece a otra sucursal');
    }
    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException('Solo se puede descontar un ticket OPEN');
    }
    if (discountAmount < 0) {
      throw new BadRequestException('El descuento no puede ser negativo');
    }
    if (discountAmount > ticket.subtotal + ticket.taxAmount) {
      throw new BadRequestException('El descuento excede el máximo del ticket');
    }
    const total = roundMoney(
      ticket.subtotal - discountAmount + ticket.taxAmount,
    );
    const updated = await this.tickets.updateTicket(ticketId, {
      discountAmount,
      total,
    });
    await this.events.emitTicketUpdated(ticket.branchId, ticketId);
    return updated;
  }
}
