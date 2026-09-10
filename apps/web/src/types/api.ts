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
  branch?: Branch | null;
  commissionRate?: number | string | null;
  isActive: boolean;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  role: Role;
  branchId?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  branchId?: string;
  isActive?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface CreateBranchDto {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CommissionRule {
  id: string;
  name: string | null;
  priority: number;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  barberId?: string | null;
  serviceId?: string | null;
  serviceCategoryId?: string | null;
  productId?: string | null;
  branchId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommissionRuleDto {
  name?: string | null;
  priority?: number;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive?: boolean;
  barberId?: string | null;
  serviceId?: string | null;
  serviceCategoryId?: string | null;
  productId?: string | null;
  branchId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateCommissionRuleDto {
  name?: string | null;
  priority?: number;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  isActive?: boolean;
  barberId?: string | null;
  serviceId?: string | null;
  serviceCategoryId?: string | null;
  productId?: string | null;
  branchId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface PreviewCommissionDto {
  barberId: string;
  branchId?: string;
  serviceId?: string;
  productId?: string;
  quantity?: number;
  unitPrice: number;
  at?: string;
}

export interface CommissionResolution {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  amount: number;
  source: 'RULE' | 'USER_RATE' | 'GLOBAL_SETTING';
  ruleId?: string;
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
  description?: string | null;
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
  description?: string | null;
  price: number | string;
  cost?: number | string | null;
  isActive: boolean;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  durationMinutes?: number;
  price: number;
  categoryId: string;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface CreateServiceCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateServiceCategoryDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateProductDto {
  sku?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
}

export interface UpdateProductDto {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  isActive?: boolean;
}

export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'RETURN';

export interface RegisterStockMovementDto {
  productId: string;
  branchId?: string;
  type: StockMovementType;
  quantity: number;
  reference?: string;
}

export interface UpdateStockThresholdDto {
  productId: string;
  branchId?: string;
  lowStockThreshold: number;
}

export interface InventoryItem {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  updatedAt: string;
  product?: Product;
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
  itemType?: 'SERVICE' | 'PRODUCT';
  type?: 'SERVICE' | 'PRODUCT';
  description?: string;
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
  code: string;
  correlativeNumber?: string;
  branchId: string;
  customerId?: string | null;
  barberId: string;
  queueEntryId?: string | null;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED';
  subtotal: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  tipAmount: string | number;
  total: string | number;
  items?: TicketItem[];
  createdAt: string;
  paidAt?: string | null;
  voidedAt?: string | null;
}

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Payment {
  id: string;
  ticketId: string;
  paymentMethodId: string;
  methodCode: string;
  methodName: string;
  amount: number;
  cashierId: string;
  cashRegisterId?: string | null;
  createdAt: string;
}

export interface AddPaymentDto {
  paymentMethodId: string;
  amount: number;
  tipAmount?: number;
}

export interface TicketDetail extends Ticket {
  items: TicketItem[];
  payments: Payment[];
  amountPaid: number;
  amountDue: number;
}

export interface CashRegister {
  id: string;
  branchId: string;
  openedById: string;
  openingAmount: number;
  openedAt: string;
  closedById?: string | null;
  closingCountedCash?: number | null;
  closedAt?: string | null;
  notes?: string | null;
}

export interface OpenCashRegisterDto {
  branchId?: string;
  openingAmount: number;
  notes?: string;
}

export interface CloseCashRegisterDto {
  closingCountedCash: number;
  notes?: string;
}

