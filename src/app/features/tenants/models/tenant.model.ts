// src/app/features/tenants/models/tenant.model.ts

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive: boolean;
  subscription?: TenantSubscription;
  settings?: Record<string, any>;
  features?: string[];
  limits?: TenantLimits;
  billing?: BillingInfo;
  createdAt: Date;
  updatedAt: Date;
}
export interface TenantResponse {
  data: Tenant[];
}

export interface TenantSubscription {
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface TenantLimits {
  maxUsers: number;
  maxProjects: number;
  maxStorageGB: number;
}

export interface BillingInfo {
  customerId?: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  currency: string;
  taxRate?: number;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  description?: string;
  domain?: string;
  settings?: Record<string, any>;
  features?: string[];
}

export interface UpdateTenantDto extends Partial<CreateTenantDto> {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isActive?: boolean;
}

export interface TenantStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  storageUsedMB: number;
  apiCallsThisMonth: number;
  subscriptionStatus: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}
