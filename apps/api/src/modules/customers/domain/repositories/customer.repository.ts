import type {
  CustomerEntity,
  LoyaltyTransactionEntity,
} from '../entities/customer.entity';
import type {
  CreateCustomerData,
  UpdateCustomerData,
} from '../interfaces/customer-data.interface';

export const CUSTOMER_REPOSITORY = 'ICustomerRepository';

export interface AccruePointsData {
  customerId: string;
  points: number;
  reason: string;
  ticketId?: string | null;
}

export interface ICustomerRepository {
  create(data: CreateCustomerData): Promise<CustomerEntity>;
  findAll(branchId?: string): Promise<CustomerEntity[]>;
  findById(id: string): Promise<CustomerEntity | null>;
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
  existsByPhone(phone: string, excludeId?: string): Promise<boolean>;
  update(id: string, data: UpdateCustomerData): Promise<CustomerEntity>;
  softDelete(id: string): Promise<void>;
  /**
   * Crea el asiento y recalcula el cache (sum) en una sola transacción.
   * Devuelve el asiento y el saldo resultante.
   */
  addTransaction(
    data: AccruePointsData,
  ): Promise<{ transaction: LoyaltyTransactionEntity; balance: number }>;
  getBalance(customerId: string): Promise<number>;
  listTransactions(customerId: string): Promise<LoyaltyTransactionEntity[]>;
}
