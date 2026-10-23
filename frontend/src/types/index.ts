export type RoleName = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_SALES';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: RoleName[];
  active: boolean;
  isDemo: boolean;
  createdAt: string;
}

export type CustomerStatus = 'LEAD' | 'PROSPECT' | 'ACTIVE_CLIENT' | 'INACTIVE';

export interface Customer {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  status: CustomerStatus;
  assignedToId?: number;
  assignedToName?: string;
  notes?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: number;
  fullName: string;
  email: string;
  companyName?: string;
}

export type InteractionType = 'CALL' | 'MEETING' | 'EMAIL' | 'NOTE';

export interface CustomerInteraction {
  id: number;
  customerId: number;
  interactionType: InteractionType;
  summary: string;
  details?: string;
  performedById?: number;
  performedByName?: string;
  interactionDate: string;
  createdAt: string;
}

export type DealStage = 'NEW' | 'CONSULTING' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface Deal {
  id: number;
  title: string;
  dealValue: number;
  stage: DealStage;
  probability: number;
  customerId: number;
  customerName: string;
  customerCompany?: string;
  assignedToId?: number;
  assignedToName?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  notes?: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealStageHistory {
  id: number;
  dealId: number;
  previousStage?: DealStage;
  newStage: DealStage;
  changedById?: number;
  changedByName?: string;
  changeDate: string;
  comment?: string;
}

export interface DealKanbanColumn {
  stage: DealStage;
  title: string;
  count: number;
  totalValue: number;
  deals: Deal[];
}

export interface StageStat {
  stage: DealStage;
  label: string;
  count: number;
  totalValue: number;
}

export interface DashboardMetrics {
  totalCustomers: number;
  realCustomersCount: number;
  demoCustomersCount: number;
  openDealsCount: number;
  totalPipelineValue: number;
  wonRevenue: number;
  stageBreakdown: StageStat[];
  recentDeals: Deal[];
  containsDemoData: boolean;
  dataModeNotice: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId?: number;
  performedBy: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiError {
  success: boolean;
  status: number;
  error: string;
  message: string;
  validationErrors?: Record<string, string>;
  timestamp: string;
}

export type ReportType = 'CUSTOMERS' | 'DEALS' | 'REVENUE_SUMMARY';
export type ReportFormat = 'CSV' | 'XLSX';
export type ReportJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export interface ReportJob {
  jobUuid: string;
  reportType: ReportType;
  format: ReportFormat;
  status: ReportJobStatus;
  startDate?: string;
  endDate?: string;
  requestedByUsername?: string;
  requestedByFullName?: string;
  fileName?: string;
  fileSizeBytes?: number;
  rowCount: number;
  errorMessage?: string;
  downloadUrl?: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ReportCreateRequest {
  reportType: ReportType;
  format: ReportFormat;
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  assignedToId?: number;
}

export type BenchmarkScenario =
  | 'DASHBOARD_METRICS'
  | 'DASHBOARD_COLD_MISS'
  | 'CUSTOMER_SEARCH'
  | 'CUSTOMER_PAGINATION'
  | 'DEAL_PIPELINE_FILTER'
  | 'REPORT_GENERATION_ASYNC';

export type BenchmarkRunType = 'BASELINE' | 'OPTIMIZED' | 'SIMULATED';

export interface SystemMetrics {
  cpuUsagePct?: number;
  cpuUsagePercent?: number;
  availableProcessors?: number;
  totalMemoryMb?: number;
  usedMemoryMb?: number;
  jvmMemoryUsedMb?: number;
  freeMemoryMb?: number;
  jvmMemoryFreeMb?: number;
  maxMemoryMb?: number;
  jvmMemoryMaxMb?: number;
  redisConnected?: boolean;
  redisKeysCount?: number;
  cacheHitRatio?: number;
  cacheHits?: number;
  cacheMisses?: number;
  hikariActiveConnections?: number;
  activeDbConnections?: number;
  hikariTotalConnections?: number;
  hikariIdleConnections?: number;
  hikariThreadsAwaitingConnection?: number;
  queuedReportJobs?: number;
  runningReportJobs?: number;
  activeReportJobs?: number;
  uptimeSeconds?: number;
  targetSloP95Ms?: number;
  targetSloAvgMs?: number;
  avgLatencyMs?: number;
  totalCustomers?: number;
  capturedAt?: string;
  timestamp?: string;
}

export interface BenchmarkRunRequest {
  scenario: BenchmarkScenario;
  runType: BenchmarkRunType;
  virtualUsers: number;
  iterations: number;
  environment?: string;
  notes?: string;
}

export interface BenchmarkResult {
  runUuid: string;
  scenarioName: BenchmarkScenario;
  scenarioDisplayName: string;
  runType: BenchmarkRunType;
  environment: string;
  virtualUsers: number;
  iterations: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  throughputRps: number;
  minLatencyMs: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  errorRate: number;
  cpuUsagePct?: number;
  memoryUsedMb?: number;
  cacheHitRatio?: number;
  executedBy: string;
  notes?: string;
  createdAt: string;
}

export interface BenchmarkComparison {
  scenario: BenchmarkScenario;
  scenarioDisplayName: string;
  baseline?: BenchmarkResult;
  optimized?: BenchmarkResult;
  p50ImprovementPct: number;
  p95ImprovementPct: number;
  avgLatencyImprovementPct: number;
  throughputImprovementPct: number;
}

