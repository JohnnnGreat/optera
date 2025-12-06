// src/app/features/projects/services/project.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectStatsDto,
  ProjectFilters,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '../models/project.model';
import { ApiConfig } from '../../../core/configs/api.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);

  /**
   * Create a new project
   * POST /api/v1/projects
   */
  createProject(projectData: CreateProjectDto): Observable<Project> {
    return this.http
      .post<Project>(this.apiConfig.projects, projectData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all projects with pagination and filtering
   * GET /api/v1/projects
   */
  getAllProjects(
    pagination?: PaginationParams,
    filters?: ProjectFilters
  ): Observable<PaginatedResponse<Project>> {
    let params = this.buildPaginationParams(pagination);
    params = this.buildFilterParams(params, filters);

    return this.http
      .get<PaginatedResponse<Project>>(this.apiConfig.projects, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get project statistics
   * GET /api/v1/projects/stats
   */
  getProjectStats(): Observable<ProjectStatsDto> {
    return this.http
      .get<ProjectStatsDto>(`${this.apiConfig.projects}/stats`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get overdue projects
   * GET /api/v1/projects/overdue
   */
  getOverdueProjects(): Observable<Project[]> {
    return this.http
      .get<Project[]>(`${this.apiConfig.projects}/overdue`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current user's projects
   * GET /api/v1/projects/my-projects
   */
  getMyProjects(): Observable<Project[]> {
    return this.http
      .get<Project[]>(`${this.apiConfig.projects}/my-projects`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get project by ID
   * GET /api/v1/projects/{id}
   */
  getProjectById(id: string): Observable<Project> {
    return this.http
      .get<Project>(`${this.apiConfig.projects}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update project by ID
   * PATCH /api/v1/projects/{id}
   */
  updateProject(id: string, projectData: UpdateProjectDto): Observable<Project> {
    return this.http
      .patch<Project>(`${this.apiConfig.projects}/${id}`, projectData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Recalculate project progress based on tasks
   * POST /api/v1/projects/{id}/update-progress
   */
  updateProjectProgress(id: string): Observable<Project> {
    return this.http
      .post<Project>(`${this.apiConfig.projects}/${id}/update-progress`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete project (soft delete)
   * DELETE /api/v1/projects/{id}
   */
  deleteProject(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiConfig.projects}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get projects by status
   */
  getProjectsByStatus(status: string, pagination?: PaginationParams): Observable<PaginatedResponse<Project>> {
    return this.getAllProjects(pagination, { status: status as any });
  }

  /**
   * Get projects by owner
   */
  getProjectsByOwner(ownerId: string, pagination?: PaginationParams): Observable<PaginatedResponse<Project>> {
    return this.getAllProjects(pagination, { ownerId });
  }

  /**
   * Search projects
   */
  searchProjects(searchTerm: string, limit: number = 10): Observable<PaginatedResponse<Project>> {
    return this.getAllProjects({ search: searchTerm, limit });
  }

  /**
   * Archive/Complete project
   */
  completeProject(id: string): Observable<Project> {
    return this.updateProject(id, { 
      status: 'completed' as any, 
      progress: 100,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Duplicate project
   */
  duplicateProject(id: string, newName: string): Observable<Project> {
    return this.getProjectById(id).pipe(
      catchError(this.handleError)
    );
    // Note: Backend would need a dedicated endpoint for duplication
    // This is a placeholder for the frontend structure
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
   * Build filter parameters
   */
  private buildFilterParams(params: HttpParams, filters?: ProjectFilters): HttpParams {
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.ownerId) params = params.set('ownerId', filters.ownerId);
      if (filters.overdue !== undefined) params = params.set('overdue', filters.overdue.toString());
      if (filters.tags && filters.tags.length > 0) {
        // Handle array of tags
        filters.tags.forEach(tag => params = params.append('tags', tag));
      }
    }

    return params;
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
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('ProjectService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}