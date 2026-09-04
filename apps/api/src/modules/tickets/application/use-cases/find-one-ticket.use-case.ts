import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';

export interface TicketScope {
  branchId?: string;
  barberId?: string;
}

@Injectable()
export class FindOneTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
  ) {}

  async execute(id: string, scope?: TicketScope) {
    const ticket = await this.tickets.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket no encontrado: ${id}`);
    }
    if (scope?.branchId && ticket.branchId !== scope.branchId) {
      throw new ForbiddenException('El ticket pertenece a otra sucursal');
    }
    if (scope?.barberId && ticket.barberId !== scope.barberId) {
      throw new ForbiddenException('El ticket pertenece a otro barbero');
    }
    return ticket;
  }
}
