import type {
  ApiResponse,
  DashboardMetrics,
  Customer,
  CustomerSummary,
  CustomerInteraction,
  Deal,
  DealKanbanColumn,
  DealStageHistory,
  PageResponse,
  User,
  AuditLog,
  CustomerStatus,
  DealStage,
  InteractionType,
  ReportJob,
  ReportCreateRequest,
  BenchmarkComparison,
  BenchmarkResult,
  BenchmarkRunRequest,
  SystemMetrics
} from '../types';

const API_BASE = '/api/v1';

export class ApiClientError extends Error {
  status: number;
  validationErrors?: Record<string, string>;

  constructor(message: string, status: number, validationErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('smartcrm_token');
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('smartcrm_token');
    localStorage.removeItem('smartcrm_user');
    if (!window.location.pathname.includes('/login')) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Yêu cầu thất bại (HTTP ${response.status})`;
    throw new ApiClientError(errorMsg, response.status, data?.validationErrors);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { username: string; password: string }) =>
      request<ApiResponse<{ token: string; type: string; user: User }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<ApiResponse<User>>('/auth/me'),
    logout: () => request<ApiResponse<string>>('/auth/logout', { method: 'POST' }),
  },

  // Dashboard
  dashboard: {
    getMetrics: () => request<ApiResponse<DashboardMetrics>>('/dashboard/metrics'),
  },

  // Customers
  customers: {
    list: (params: { search?: string; status?: CustomerStatus | ''; assignedToId?: number | ''; page?: number; size?: number; sortBy?: string; direction?: string; signal?: AbortSignal }) => {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.assignedToId) query.append('assignedToId', params.assignedToId.toString());
      if (params.page !== undefined) query.append('page', params.page.toString());
      if (params.size !== undefined) query.append('size', params.size.toString());
      if (params.sortBy) query.append('sortBy', params.sortBy);
      if (params.direction) query.append('direction', params.direction);
      return request<ApiResponse<PageResponse<Customer>>>(`/customers?${query.toString()}`, { signal: params.signal });
    },
    get: (id: number) => request<ApiResponse<Customer>>(`/customers/${id}`),
    create: (data: {
      fullName: string;
      email: string;
      phoneNumber?: string;
      companyName?: string;
      status?: CustomerStatus;
      assignedToId?: number;
      notes?: string;
    }) => request<ApiResponse<Customer>>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: {
      fullName: string;
      email: string;
      phoneNumber?: string;
      companyName?: string;
      status?: CustomerStatus;
      assignedToId?: number;
      notes?: string;
    }) => request<ApiResponse<Customer>>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => request<ApiResponse<void>>(`/customers/${id}`, { method: 'DELETE' }),
    summaries: () => request<ApiResponse<CustomerSummary[]>>('/customers/summaries'),
    getInteractions: (customerId: number) =>
      request<ApiResponse<CustomerInteraction[]>>(`/customers/${customerId}/interactions`),
    addInteraction: (customerId: number, data: {
      interactionType: InteractionType;
      summary: string;
      details?: string;
      interactionDate?: string;
    }) => request<ApiResponse<CustomerInteraction>>(`/customers/${customerId}/interactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Deal Pipeline
  deals: {
    list: (page = 0, size = 15) =>
      request<ApiResponse<PageResponse<Deal>>>(`/deals?page=${page}&size=${size}`),
    all: () => request<ApiResponse<Deal[]>>('/deals/all'),
    kanban: () => request<ApiResponse<DealKanbanColumn[]>>('/deals/kanban'),
    get: (id: number) => request<ApiResponse<Deal>>(`/deals/${id}`),
    create: (data: {
      title: string;
      dealValue: number;
      stage?: DealStage;
      probability?: number;
      customerId: number;
      assignedToId?: number;
      expectedCloseDate?: string;
      notes?: string;
    }) => request<ApiResponse<Deal>>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: {
      title: string;
      dealValue: number;
      stage?: DealStage;
      probability?: number;
      customerId: number;
      assignedToId?: number;
      expectedCloseDate?: string;
      actualCloseDate?: string;
      notes?: string;
    }) => request<ApiResponse<Deal>>(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    updateStage: (id: number, data: { newStage: DealStage; comment?: string }) =>
      request<ApiResponse<Deal>>(`/deals/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    history: (id: number) => request<ApiResponse<DealStageHistory[]>>(`/deals/${id}/history`),
    delete: (id: number) => request<ApiResponse<void>>(`/deals/${id}`, { method: 'DELETE' }),
  },

  // User Management
  users: {
    list: () => request<ApiResponse<User[]>>('/users'),
    active: () => request<ApiResponse<User[]>>('/users/active'),
    get: (id: number) => request<ApiResponse<User>>(`/users/${id}`),
    create: (data: {
      username: string;
      email: string;
      password?: string;
      fullName: string;
      phoneNumber?: string;
      roles: string[];
    }) => request<ApiResponse<User>>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: {
      fullName: string;
      phoneNumber?: string;
      roles?: string[];
      active?: boolean;
    }) => request<ApiResponse<User>>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => request<ApiResponse<void>>(`/users/${id}`, { method: 'DELETE' }),
  },

  // Audit Logs
  audit: {
    list: (page = 0, size = 20) =>
      request<ApiResponse<PageResponse<AuditLog>>>(`/audit-logs?page=${page}&size=${size}`),
  },

  // Reports (Phase 3: Asynchronous RabbitMQ Reporting)
  reports: {
    create: (data: ReportCreateRequest) =>
      request<ApiResponse<ReportJob>>('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStatus: (jobUuid: string) =>
      request<ApiResponse<ReportJob>>(`/reports/${jobUuid}`),
    list: (page = 0, size = 10) =>
      request<ApiResponse<PageResponse<ReportJob>>>(`/reports?page=${page}&size=${size}`),
    download: async (jobUuid: string, fileName?: string) => {
      const token = localStorage.getItem('smartcrm_token');
      const headers = new Headers();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const response = await fetch(`${API_BASE}/reports/${jobUuid}/download`, { headers });
      if (!response.ok) {
        let errorMsg = 'Không thể tải báo cáo';
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `report_${jobUuid}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  },

  // Performance Lab & Observability (Phase 4)
  performance: {
    getMetrics: () =>
      request<ApiResponse<SystemMetrics>>('/performance/metrics'),
    getComparisons: () =>
      request<ApiResponse<BenchmarkComparison[]>>('/performance/comparisons'),
    getHistory: (page = 0, size = 10) =>
      request<ApiResponse<PageResponse<BenchmarkResult>>>(`/performance/history?page=${page}&size=${size}`),
    getBenchmark: (runUuid: string) =>
      request<ApiResponse<BenchmarkResult>>(`/performance/benchmarks/${runUuid}`),
    runBenchmark: (data: BenchmarkRunRequest) =>
      request<ApiResponse<BenchmarkResult>>('/performance/benchmarks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
