import { Inject, Injectable } from '@nestjs/common';
import type { TicketStatus } from '@prisma/client';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';

@Injectable()
export class FindAllTicketsUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
  ) {}

  execute(branchId?: string, status?: TicketStatus, barberId?: string) {
    return this.tickets.findAll({ branchId, status, barberId });
  }
}
