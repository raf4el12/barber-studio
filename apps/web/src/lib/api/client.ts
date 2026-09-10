import type {
  CreateTicketDto,
  PerformanceSummary,
  Product,
  QueueEntry,
  QueueStatus,
  Service,
  ServiceCategory,
  Ticket,
  TicketDetail,
  User,
  Branch,
  CashRegister,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  PaymentMethod,
  AddPaymentDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  RegisterStockMovementDto,
  UpdateStockThresholdDto,
  InventoryItem,
  CreateUserDto,
  UpdateUserDto,
  CreateBranchDto,
  UpdateBranchDto,
  CommissionRule,
  CreateCommissionRuleDto,
  UpdateCommissionRuleDto,
  PreviewCommissionDto,
  CommissionResolution,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerLoyaltyData,
  LoyaltyLedgerEntry,
  RedeemLoyaltyDto,
  ZReportData,
  BarberPayoutsReport,
  BusinessMetricsReport,
} from '@/types/api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('barber_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    let details: unknown = null;
    try {
      const data = await response.json();
      if (Array.isArray(data.message)) {
        errorMessage = data.message.join(', ');
      } else if (typeof data.message === 'string') {
        errorMessage = data.message;
      }
      details = data;
    } catch {
      // Body not JSON
    }
    throw new ApiError(response.status, errorMessage, details);
  }

  // Check 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>('/auth/me'),
  },

  queue: {
    list: (params?: { branchId?: string; status?: QueueStatus[] }) => {
      const query = new URLSearchParams();
      if (params?.branchId) query.set('branchId', params.branchId);
      if (params?.status?.length) query.set('status', params.status.join(','));
      const q = query.toString();
      return request<QueueEntry[]>(`/queue${q ? `?${q}` : ''}`);
    },

    create: (dto: {
      customerName?: string;
      customerPhone?: string;
      customerId?: string;
      assignedBarberId?: string;
      branchId?: string;
      notes?: string;
    }) =>
      request<QueueEntry>('/queue', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),

    assign: (id: string, assignedBarberId: string) =>
      request<QueueEntry>(`/queue/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedBarberId }),
      }),

    changeStatus: (id: string, status: QueueStatus) =>
      request<QueueEntry>(`/queue/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  performance: {
    get: (branchId?: string) => {
      const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<PerformanceSummary>(`/me/performance${query}`);
    },
  },

  catalog: {
    getServices: (categoryId?: string) => {
      const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
      return request<Service[]>(`/services${q}`);
    },
    getService: (id: string) => request<Service>(`/services/${id}`),
    createService: (dto: CreateServiceDto) =>
      request<Service>('/services', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    updateService: (id: string, dto: UpdateServiceDto) =>
      request<Service>(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    deleteService: (id: string) =>
      request<void>(`/services/${id}`, {
        method: 'DELETE',
      }),

    getCategories: () => request<ServiceCategory[]>('/service-categories'),
    getCategory: (id: string) => request<ServiceCategory>(`/service-categories/${id}`),
    createCategory: (dto: CreateServiceCategoryDto) =>
      request<ServiceCategory>('/service-categories', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    updateCategory: (id: string, dto: UpdateServiceCategoryDto) =>
      request<ServiceCategory>(`/service-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    deleteCategory: (id: string) =>
      request<void>(`/service-categories/${id}`, {
        method: 'DELETE',
      }),

    getProducts: () => request<Product[]>('/products'),
  },

  products: {
    list: () => request<Product[]>('/products'),
    getById: (id: string) => request<Product>(`/products/${id}`),
    create: (dto: CreateProductDto) =>
      request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: UpdateProductDto) =>
      request<Product>(`/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<void>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  inventory: {
    list: (branchId?: string) => {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<InventoryItem[]>(`/inventory${q}`);
    },
    listLowStock: (branchId?: string) => {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<InventoryItem[]>(`/inventory/low-stock${q}`);
    },
    registerMovement: (dto: RegisterStockMovementDto) =>
      request<unknown>('/inventory/movements', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    updateThreshold: (dto: UpdateStockThresholdDto) =>
      request<InventoryItem>('/inventory/threshold', {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
  },

  tickets: {
    create: (dto: CreateTicketDto) =>
      request<Ticket>('/tickets', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    list: (params?: {
      branchId?: string;
      status?: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'VOIDED';
      barberId?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.branchId) query.set('branchId', params.branchId);
      if (params?.status) query.set('status', params.status);
      if (params?.barberId) query.set('barberId', params.barberId);
      const q = query.toString();
      return request<Ticket[]>(`/tickets${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<TicketDetail>(`/tickets/${id}`),
    addPayment: (id: string, dto: AddPaymentDto) =>
      request<TicketDetail>(`/tickets/${id}/payments`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    applyDiscount: (id: string, discountAmount: number) =>
      request<TicketDetail>(`/tickets/${id}/discount`, {
        method: 'PATCH',
        body: JSON.stringify({ discountAmount }),
      }),
    void: (id: string) =>
      request<TicketDetail>(`/tickets/${id}/void`, {
        method: 'POST',
      }),
  },

  cashRegisters: {
    getActive: (branchId?: string) => {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<CashRegister | null>(`/cash-registers/active${q}`);
    },
    open: (dto: OpenCashRegisterDto) =>
      request<CashRegister>('/cash-registers/open', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    close: (id: string, dto: CloseCashRegisterDto) =>
      request<CashRegister>(`/cash-registers/${id}/close`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    list: (branchId?: string) => {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<CashRegister[]>(`/cash-registers${q}`);
    },
  },

  paymentMethods: {
    list: (isActive = true) => {
      const q = isActive !== undefined ? `?isActive=${isActive}` : '';
      return request<PaymentMethod[]>(`/payment-methods${q}`);
    },
  },

  users: {
    list: () => request<User[]>('/users'),
    getById: (id: string) => request<User>(`/users/${id}`),
    create: (dto: CreateUserDto) =>
      request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: UpdateUserDto) =>
      request<User>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<void>(`/users/${id}`, {
        method: 'DELETE',
      }),
  },

  branches: {
    list: () => request<Branch[]>('/branches'),
    getById: (id: string) => request<Branch>(`/branches/${id}`),
    create: (dto: CreateBranchDto) =>
      request<Branch>('/branches', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: UpdateBranchDto) =>
      request<Branch>(`/branches/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<void>(`/branches/${id}`, {
        method: 'DELETE',
      }),
  },

  commissions: {
    list: () => request<CommissionRule[]>('/commission-rules'),
    getById: (id: string) => request<CommissionRule>(`/commission-rules/${id}`),
    create: (dto: CreateCommissionRuleDto) =>
      request<CommissionRule>('/commission-rules', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: UpdateCommissionRuleDto) =>
      request<CommissionRule>(`/commission-rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<void>(`/commission-rules/${id}`, {
        method: 'DELETE',
      }),
    preview: (dto: PreviewCommissionDto) =>
      request<CommissionResolution>('/commission-rules/preview', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },

  customers: {
    list: (branchId?: string) => {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<Customer[]>(`/customers${q}`);
    },
    getById: (id: string) => request<Customer>(`/customers/${id}`),
    create: (dto: CreateCustomerDto) =>
      request<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    update: (id: string, dto: UpdateCustomerDto) =>
      request<Customer>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    delete: (id: string) =>
      request<void>(`/customers/${id}`, {
        method: 'DELETE',
      }),
    getHistory: (id: string, branchId?: string) => {
      const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
      return request<Ticket[]>(`/customers/${id}/history${q}`);
    },
    getLoyalty: (id: string) =>
      request<CustomerLoyaltyData>(`/customers/${id}/loyalty`),
    redeemLoyalty: (id: string, dto: RedeemLoyaltyDto) =>
      request<LoyaltyLedgerEntry>(`/customers/${id}/loyalty/redeem`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },

  reports: {
    zReport: (query: {
      cashRegisterId?: string;
      branchId?: string;
      date?: string;
    }) => {
      const params = new URLSearchParams();
      if (query.cashRegisterId) params.append('cashRegisterId', query.cashRegisterId);
      if (query.branchId) params.append('branchId', query.branchId);
      if (query.date) params.append('date', query.date);
      const q = params.toString() ? `?${params.toString()}` : '';
      return request<ZReportData>(`/reports/z-report${q}`);
    },
    barberPayouts: (query: {
      branchId?: string;
      from?: string;
      to?: string;
    }) => {
      const params = new URLSearchParams();
      if (query.branchId) params.append('branchId', query.branchId);
      if (query.from) params.append('from', query.from);
      if (query.to) params.append('to', query.to);
      const q = params.toString() ? `?${params.toString()}` : '';
      return request<BarberPayoutsReport>(`/reports/barber-payouts${q}`);
    },
    metrics: (query: {
      branchId?: string;
      from?: string;
      to?: string;
    }) => {
      const params = new URLSearchParams();
      if (query.branchId) params.append('branchId', query.branchId);
      if (query.from) params.append('from', query.from);
      if (query.to) params.append('to', query.to);
      const q = params.toString() ? `?${params.toString()}` : '';
      return request<BusinessMetricsReport>(`/reports/metrics${q}`);
    },
  },
};
