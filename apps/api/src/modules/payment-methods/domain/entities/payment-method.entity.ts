export class PaymentMethodEntity {
  id!: string;
  code!: string;
  name!: string;
  isActive!: boolean;
  sortOrder!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
