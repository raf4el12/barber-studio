import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ItemType, StockMovementType, TicketStatus } from '@prisma/client';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../domain/repositories/ticket.repository';
import {
  TICKET_EVENTS,
  type ITicketEvents,
} from '../../domain/repositories/ticket-events.repository';
import {
  INVENTORY_REPOSITORY,
  type IInventoryRepository,
} from '../../../inventory/domain/repositories/inventory.repository';
import { WriteAuditLogUseCase } from '../../../audit/application/use-cases/write-audit-log.use-case';
import { AuditAction } from '../../../audit/domain/constants/audit-actions';

@Injectable()
export class VoidTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventory: IInventoryRepository,
    @Inject(TICKET_EVENTS) private readonly events: ITicketEvents,
    private readonly audit: WriteAuditLogUseCase,
  ) {}

  async execute(ticketId: string, userId: string, scopeBranchId?: string) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket no encontrado: ${ticketId}`);
    }
    if (scopeBranchId && ticket.branchId !== scopeBranchId) {
      throw new ForbiddenException('El ticket pertenece a otra sucursal');
    }
    if (ticket.status === TicketStatus.VOIDED) {
      throw new BadRequestException('El ticket ya está anulado');
    }
    const wasPaid = ticket.status === TicketStatus.PAID;
    const updated = await this.tickets.updateTicket(ticketId, {
      status: TicketStatus.VOIDED,
      voidedAt: new Date(),
    });
    if (wasPaid) {
      for (const item of ticket.items) {
        if (item.itemType !== ItemType.PRODUCT || !item.productId) continue;
        await this.inventory.registerMovement({
          branchId: ticket.branchId,
          productId: item.productId,
          type: StockMovementType.RETURN,
          quantity: item.quantity,
          reference: ticket.code,
          createdById: userId,
        });
      }
    }
    await this.events.emitTicketVoided(ticket.branchId, ticketId);
    await this.audit.execute({
      userId,
      branchId: ticket.branchId,
      action: AuditAction.TICKET_VOIDED,
      entityType: 'Ticket',
      entityId: ticketId,
      metadata: {
        code: ticket.code,
        statusBefore: ticket.status,
        total: ticket.total,
      },
    });
    return updated;
  }
}
