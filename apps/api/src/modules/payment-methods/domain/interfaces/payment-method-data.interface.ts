export interface CreatePaymentMethodData {
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export type UpdatePaymentMethodData = Partial<CreatePaymentMethodData>;
