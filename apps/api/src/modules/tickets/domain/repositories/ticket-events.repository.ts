export const TICKET_EVENTS = 'ITicketEvents';

/**
 * Puerto de salida para notificar al POS.
 * El adapter carga el detalle vigente y emite a la room `branch:{branchId}`:
 * `ticket.created` / `ticket.updated` / `ticket.paid` / `ticket.voided`.
 */
export interface ITicketEvents {
  emitTicketCreated(branchId: string, ticketId: string): Promise<void>;
  emitTicketUpdated(branchId: string, ticketId: string): Promise<void>;
  emitTicketPaid(branchId: string, ticketId: string): Promise<void>;
  emitTicketVoided(branchId: string, ticketId: string): Promise<void>;
}
