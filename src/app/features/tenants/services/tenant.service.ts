// src/app/features/tenants/services/tenant.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  Tenant,
  CreateTenantDto,
  UpdateTenantDto,
  TenantStatsDto,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  TenantResponse,
} from '../models/tenant.model';
import { ApiConfig } from '../../../core/configs/api.config';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);

  // Current tenant management
  private readonly CURRENT_TENANT_KEY = 'flowhub_current_tenant';
  private currentTenantSubject = new BehaviorSubject<Tenant | null>(
    this.getCurrentTenantFromStorage()
  );
  public currentTenant$ = this.currentTenantSubject.asObservable();

  /**
   * Create a new tenant (super admin only)
   * POST /api/v1/tenants
   */
  createTenant(tenantData: CreateTenantDto): Observable<Tenant> {
    return this.http
      .post<Tenant>(this.apiConfig.tenants, tenantData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all tenants with pagination
   * GET /api/v1/tenants
   */
  getAllTenants(pagination?: PaginationParams): Observable<PaginatedResponse<Tenant>> {
    let params = this.buildPaginationParams(pagination);

    return this.http
      .get<PaginatedResponse<Tenant>>(this.apiConfig.tenants, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get tenant statistics
   * GET /api/v1/tenants/stats
   */
  getTenantStats(): Observable<TenantStatsDto> {
    return this.http
      .get<TenantStatsDto>(`${this.apiConfig.tenants}/stats`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current user's tenants
   * GET /api/v1/tenants/my-tenants
   */
  getMyTenants(): Observable<TenantResponse> {
    return this.http
      .get<TenantResponse>(`${this.apiConfig.tenants}/my-tenants`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get tenant by ID
   * GET /api/v1/tenants/{id}
   */
  getTenantById(id: string): Observable<Tenant> {
    return this.http
      .get<Tenant>(`${this.apiConfig.tenants}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update tenant by ID
   * PATCH /api/v1/tenants/{id}
   */
  updateTenant(id: string, tenantData: UpdateTenantDto): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.apiConfig.tenants}/${id}`, tenantData).pipe(
      tap((tenant) => {
        // Update current tenant if it's the one being updated
        const currentTenant = this.currentTenantSubject.value;
        if (currentTenant && currentTenant.id === id) {
          this.setCurrentTenant(tenant);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete tenant (soft delete)
   * DELETE /api/v1/tenants/{id}
   */
  deleteTenant(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiConfig.tenants}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Activate tenant
   * POST /api/v1/tenants/{id}/activate
   */
  activateTenant(id: string): Observable<Tenant> {
    return this.http
      .post<Tenant>(`${this.apiConfig.tenants}/${id}/activate`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Deactivate tenant
   * POST /api/v1/tenants/{id}/deactivate
   */
  deactivateTenant(id: string): Observable<Tenant> {
    return this.http
      .post<Tenant>(`${this.apiConfig.tenants}/${id}/deactivate`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Join tenant
   * POST /api/v1/tenants/{id}/join
   */
  joinTenant(id: string): Observable<Tenant> {
    return this.http
      .post<Tenant>(`${this.apiConfig.tenants}/${id}/join`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Leave tenant
   * POST /api/v1/tenants/{id}/leave
   */
  leaveTenant(id: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiConfig.tenants}/${id}/leave`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload tenant logo
   */
  uploadTenantLogo(tenantId: string, file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http
      .post<{ logoUrl: string }>(`${this.apiConfig.tenants}/${tenantId}/logo`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get tenant by slug
   */
  getTenantBySlug(slug: string): Observable<Tenant> {
    return this.http
      .get<Tenant>(`${this.apiConfig.tenants}/slug/${slug}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Check tenant slug availability
   */
  checkSlugAvailability(slug: string): Observable<{ available: boolean }> {
    return this.http
      .get<{ available: boolean }>(`${this.apiConfig.tenants}/check-slug/${slug}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Search tenants
   */
  searchTenants(searchTerm: string, limit: number = 10): Observable<PaginatedResponse<Tenant>> {
    return this.getAllTenants({ search: searchTerm, limit });
  }

  /**
   * Get active tenants only
   */
  getActiveTenants(pagination?: PaginationParams): Observable<PaginatedResponse<Tenant>> {
    // This would ideally be supported by the backend with a filter parameter
    return this.getAllTenants(pagination);
  }

  // Current Tenant Management Methods

  /**
   * Set current tenant
   */
  setCurrentTenant(tenant: Tenant): void {
    localStorage.setItem(this.CURRENT_TENANT_KEY, JSON.stringify(tenant));
    this.currentTenantSubject.next(tenant);
  }

  /**
   * Get current tenant
   */
  getCurrentTenant(): Tenant | null {
    return this.currentTenantSubject.value;
  }

  /**
   * Clear current tenant
   */
  clearCurrentTenant(): void {
    localStorage.removeItem(this.CURRENT_TENANT_KEY);
    this.currentTenantSubject.next(null);
  }

  /**
   * Switch to different tenant
   */
  switchTenant(tenantId: string): Observable<Tenant> {
    return this.getTenantById(tenantId).pipe(
      tap((tenant) => this.setCurrentTenant(tenant)),
      catchError(this.handleError)
    );
  }

  /**
   * Get current tenant ID for headers
   */
  getCurrentTenantId(): string | null {
    const tenant = this.getCurrentTenant();
    return tenant ? tenant.id : null;
  }

  /**
   * Build pagination parameters
   */
  private buildPaginationParams(pagination?: PaginationParams): HttpParams {
    let params = new HttpParams();

    if (pagination) {
      if (pagination.page) params = params.set('page', pagination.page.toString());
      if (pagination.limit) params = params.set('limit', pagination.limit.toString());
      if (pagination.search) params = params.set('search', pagination.search);
      if (pagination.sortBy) params = params.set('sortBy', pagination.sortBy);
      if (pagination.sortOrder) params = params.set('sortOrder', pagination.sortOrder);
    }

    return params;
  }

  /**
   * Get current tenant from localStorage
   */
  private getCurrentTenantFromStorage(): Tenant | null {
    const tenantJson = localStorage.getItem(this.CURRENT_TENANT_KEY);
    return tenantJson ? JSON.parse(tenantJson) : null;
  }

  /**
   * Error handler
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage =
        error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('TenantService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
