import type { PaymentMethodEntity } from '../entities/payment-method.entity';
import type {
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from '../interfaces/payment-method-data.interface';

export const PAYMENT_METHOD_REPOSITORY = 'IPaymentMethodRepository';

export interface IPaymentMethodRepository {
  create(data: CreatePaymentMethodData): Promise<PaymentMethodEntity>;
  findAll(isActive?: boolean): Promise<PaymentMethodEntity[]>;
  findById(id: string): Promise<PaymentMethodEntity | null>;
  findByCode(code: string): Promise<PaymentMethodEntity | null>;
  update(
    id: string,
    data: UpdatePaymentMethodData,
  ): Promise<PaymentMethodEntity>;
  delete(id: string): Promise<void>;
  hasPayments(id: string): Promise<boolean>;
}
