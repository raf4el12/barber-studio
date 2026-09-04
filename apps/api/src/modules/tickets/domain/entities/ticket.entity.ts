import type { CommissionType, ItemType, TicketStatus } from '@prisma/client';

export class TicketEntity {
  id!: string;
  code!: string;
  status!: TicketStatus;
  branchId!: string;
  barberId!: string;
  customerId!: string | null;
  queueEntryId!: string | null;
  subtotal!: number;
  discountAmount!: number;
  taxAmount!: number;
  tipAmount!: number;
  total!: number;
  createdAt!: Date;
  paidAt!: Date | null;
  voidedAt!: Date | null;
}

export class TicketItemEntity {
  id!: string;
  ticketId!: string;
  itemType!: ItemType;
  serviceId!: string | null;
  productId!: string | null;
  description!: string;
  quantity!: number;
  unitPrice!: number;
  discountAmount!: number;
  taxRate!: number;
  taxAmount!: number;
  lineTotal!: number;
  commissionType!: CommissionType;
  commissionValue!: number;
  commissionAmount!: number;
}

export class PaymentEntity {
  id!: string;
  ticketId!: string;
  paymentMethodId!: string;
  methodCode!: string;
  methodName!: string;
  amount!: number;
  cashierId!: string;
  cashRegisterId!: string | null;
  createdAt!: Date;
}

export class TicketDetail extends TicketEntity {
  items!: TicketItemEntity[];
  payments!: PaymentEntity[];
  amountPaid!: number;
  amountDue!: number;
}
