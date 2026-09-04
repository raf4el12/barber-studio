import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CUSTOMER_REPOSITORY,
  type ICustomerRepository,
} from '../../domain/repositories/customer.repository';
import {
  TICKET_REPOSITORY,
  type ITicketRepository,
} from '../../../tickets/domain/repositories/ticket.repository';

@Injectable()
export class GetCustomerHistoryUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
    @Inject(TICKET_REPOSITORY) private readonly tickets: ITicketRepository,
  ) {}

  async execute(customerId: string, branchId?: string) {
    const customer = await this.customers.findById(customerId);
    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado: ${customerId}`);
    }
    return this.tickets.findAll({ customerId, ...(branchId && { branchId }) });
  }
}

@Injectable()
export class GetCustomerLoyaltyUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: ICustomerRepository,
  ) {}

  async execute(customerId: string) {
    const customer = await this.customers.findById(customerId);
    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado: ${customerId}`);
    }
    const transactions = await this.customers.listTransactions(customerId);
    let running = 0;
    const ledger = [...transactions]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((t) => {
        running += t.points;
        return { ...t, runningBalance: running };
      });
    return { customerId, balance: customer.loyaltyPoints, ledger };
  }
}
