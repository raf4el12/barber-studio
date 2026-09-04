import type { CommissionType, ItemType, TicketStatus } from '@prisma/client';

export interface CreateTicketItemData {
  itemType: ItemType;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  commissionType: CommissionType;
  commissionValue: number;
  commissionAmount: number;
}

export interface CreateTicketData {
  code: string;
  branchId: string;
  barberId: string;
  customerId?: string | null;
  queueEntryId?: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  items: CreateTicketItemData[];
}

export interface UpdateTicketData {
  status?: TicketStatus;
  discountAmount?: number;
  tipAmount?: number;
  total?: number;
  paidAt?: Date | null;
  voidedAt?: Date | null;
}

export interface CreatePaymentData {
  ticketId: string;
  paymentMethodId: string;
  amount: number;
  cashierId: string;
  cashRegisterId: string;
}

export interface TicketFilters {
  branchId?: string;
  status?: TicketStatus;
  barberId?: string;
  customerId?: string;
}
