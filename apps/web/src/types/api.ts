export type Role = 'OWNER' | 'CASHIER' | 'BARBER';

export type QueueStatus =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  commissionRate?: number | string | null;
  isActive: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface QueueEntry {
  id: string;
  sequenceNumber: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerId?: string | null;
  assignedBarberId?: string | null;
  assignedBarber?: {
    id: string;
    name: string;
  } | null;
  branchId: string;
  status: QueueStatus;
  serviceStartTime?: string | null;
  serviceEndTime?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSummary {
  completedTurns: number;
  completedTickets: number;
  totalCommission: string;
  totalTips: string;
  netPayout: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number | string;
  durationMinutes?: number | null;
  categoryId: string;
  category?: ServiceCategory;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  cost?: number | string | null;
  isActive: boolean;
}

export interface CreateTicketItemDto {
  serviceId?: string;
  productId?: string;
  quantity: number;
  unitPrice?: number;
  discountAmount?: number;
}

export interface CreateTicketDto {
  customerId?: string;
  branchId?: string;
  queueEntryId?: string;
  items: CreateTicketItemDto[];
  tipAmount?: number;
}

export interface TicketItem {
  id: string;
  type: 'SERVICE' | 'PRODUCT';
  serviceId?: string | null;
  service?: Service | null;
  productId?: string | null;
  product?: Product | null;
  quantity: number;
  unitPrice: string | number;
  discountAmount: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  lineTotal: string | number;
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionValue: string | number;
  commissionAmount: string | number;
}

export interface Ticket {
  id: string;
  correlativeNumber: string;
  branchId: string;
  customerId?: string | null;
  barberId: string;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED';
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  tipAmount: string | number;
  total: string | number;
  items: TicketItem[];
  createdAt: string;
}
