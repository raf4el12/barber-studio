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
    getServices: () => request<Service[]>('/services'),
    getCategories: () => request<ServiceCategory[]>('/service-categories'),
    getProducts: () => request<Product[]>('/products'),
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

  branches: {
    list: () => request<Branch[]>('/branches'),
  },
};
