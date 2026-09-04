import type { TicketDetail, TicketEntity } from '../entities/ticket.entity';
import type {
  CreatePaymentData,
  CreateTicketData,
  TicketFilters,
  UpdateTicketData,
} from '../interfaces/ticket-data.interface';
import type { PaymentEntity } from '../entities/ticket.entity';

export const TICKET_REPOSITORY = 'ITicketRepository';

export interface ITicketRepository {
  /** Crea ticket + ítems anidados en una sola operación (snapshot atómico). */
  createTicket(data: CreateTicketData): Promise<TicketDetail>;
  findAll(filters: TicketFilters): Promise<TicketEntity[]>;
  findById(id: string): Promise<TicketDetail | null>;
  createPayment(data: CreatePaymentData): Promise<PaymentEntity>;
  updateTicket(id: string, data: UpdateTicketData): Promise<TicketDetail>;
  sumPaidCommissionsByBarberSince(
    barberId: string,
    branchId: string,
    since: Date,
  ): Promise<number>;
}
