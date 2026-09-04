export class CustomerEntity {
  id!: string;
  name!: string;
  phone!: string | null;
  email!: string | null;
  notes!: string | null;
  loyaltyPoints!: number;
  isActive!: boolean;
  branchId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt!: Date | null;
}

export class LoyaltyTransactionEntity {
  id!: string;
  customerId!: string;
  points!: number;
  reason!: string;
  ticketId!: string | null;
  createdAt!: Date;
}
