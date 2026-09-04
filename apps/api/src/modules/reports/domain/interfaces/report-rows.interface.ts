/** Fila de cobro para reportes: solo pagos de tickets PAID no anulados. */
export interface ReportPaymentRow {
  ticketId: string;
  branchId: string;
  barberId: string;
  barberName: string;
  methodCode: string;
  methodName: string;
  amount: number;
  paidAt: Date;
  cashRegisterId: string | null;
}

/** Fila de ticket cobrado para reportes. */
export interface ReportTicketRow {
  id: string;
  branchId: string;
  barberId: string;
  barberName: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
  paidAt: Date;
  cashRegisterId: string | null;
}

/** Fila de línea cobrada para payouts y top de servicios. */
export interface ReportItemRow {
  ticketId: string;
  branchId: string;
  barberId: string;
  barberName: string;
  itemType: 'SERVICE' | 'PRODUCT';
  serviceId: string | null;
  serviceName: string | null;
  quantity: number;
  lineTotal: number;
  commissionAmount: number;
  paidAt: Date;
  cashRegisterId: string | null;
}

export type ReportScope =
  | { kind: 'register'; cashRegisterId: string }
  | { kind: 'day'; branchId: string; from: Date; to: Date };

export interface DateRange {
  branchId: string;
  from: Date;
  to: Date;
}
