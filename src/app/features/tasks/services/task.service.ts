// src/app/features/tasks/services/task.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskPositionDto,
  BulkUpdateTasksDto,
  TaskFilters,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '../models/task.model';
import { ApiConfig } from '../../../core/configs/api.config';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfig);

  /**
   * Create a new task
   * POST /api/v1/tasks
   */
  createTask(taskData: CreateTaskDto): Observable<Task> {
    return this.http
      .post<Task>(this.apiConfig.tasks, taskData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all tasks with pagination and filtering
   * GET /api/v1/tasks
   */
  getAllTasks(
    pagination?: PaginationParams,
    filters?: TaskFilters
  ): Observable<PaginatedResponse<Task>> {
    let params = this.buildPaginationParams(pagination);
    params = this.buildFilterParams(params, filters);

    return this.http
      .get<PaginatedResponse<Task>>(this.apiConfig.tasks, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get overdue tasks
   * GET /api/v1/tasks/overdue
   */
  getOverdueTasks(): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiConfig.tasks}/overdue`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current user's assigned tasks
   * GET /api/v1/tasks/my-tasks
   */
  getMyTasks(): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiConfig.tasks}/my-tasks`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get tasks by project ID
   * GET /api/v1/tasks/project/{projectId}
   */
  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiConfig.tasks}/project/${projectId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get subtasks of a task
   * GET /api/v1/tasks/{id}/subtasks
   */
  getSubtasks(taskId: string): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiConfig.tasks}/${taskId}/subtasks`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get task by ID
   * GET /api/v1/tasks/{id}
   */
  getTaskById(id: string): Observable<Task> {
    return this.http
      .get<Task>(`${this.apiConfig.tasks}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update task by ID
   * PATCH /api/v1/tasks/{id}
   */
  updateTask(id: string, taskData: UpdateTaskDto): Observable<Task> {
    return this.http
      .patch<Task>(`${this.apiConfig.tasks}/${id}`, taskData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update task position/order
   * PATCH /api/v1/tasks/{id}/position
   */
  updateTaskPosition(id: string, positionData: UpdateTaskPositionDto): Observable<Task> {
    return this.http
      .patch<Task>(`${this.apiConfig.tasks}/${id}/position`, positionData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update checklist item
   * PATCH /api/v1/tasks/{id}/checklist/{checklistItemId}
   */
  updateChecklistItem(taskId: string, checklistItemId: string, completed: boolean): Observable<Task> {
    return this.http
      .patch<Task>(`${this.apiConfig.tasks}/${taskId}/checklist/${checklistItemId}`, { completed })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk update multiple tasks
   * POST /api/v1/tasks/bulk-update
   */
  bulkUpdateTasks(bulkUpdateData: BulkUpdateTasksDto): Observable<Task[]> {
    return this.http
      .post<Task[]>(`${this.apiConfig.tasks}/bulk-update`, bulkUpdateData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete task (soft delete)
   * DELETE /api/v1/tasks/{id}
   */
  deleteTask(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiConfig.tasks}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get tasks by assignee
   */
  getTasksByAssignee(assigneeId: string, pagination?: PaginationParams): Observable<PaginatedResponse<Task>> {
    return this.getAllTasks(pagination, { assigneeId });
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: string, pagination?: PaginationParams): Observable<PaginatedResponse<Task>> {
    return this.getAllTasks(pagination, { status: status as any });
  }

  /**
   * Search tasks
   */
  searchTasks(searchTerm: string, limit: number = 10): Observable<PaginatedResponse<Task>> {
    return this.getAllTasks({ search: searchTerm, limit });
  }

  /**
   * Complete task
   */
  completeTask(id: string): Observable<Task> {
    return this.updateTask(id, { 
      status: 'completed' as any,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * Move task to project
   */
  moveTaskToProject(taskId: string, newProjectId: string, newPosition: number = 0): Observable<Task> {
    return this.updateTaskPosition(taskId, { projectId: newProjectId, position: newPosition });
  }

  /**
   * Assign task to user
   */
  assignTask(taskId: string, assigneeId: string): Observable<Task> {
    return this.updateTask(taskId, { assigneeId });
  }

  /**
   * Unassign task
   */
  unassignTask(taskId: string): Observable<Task> {
    return this.updateTask(taskId, { assigneeId: undefined });
  }

  /**
   * Set task priority
   */
  setTaskPriority(taskId: string, priority: string): Observable<Task> {
    return this.updateTask(taskId, { priority: priority as any });
  }

  /**
   * Add attachment to task
   */
  addTaskAttachment(taskId: string, attachmentUrl: string): Observable<Task> {
    return this.getTaskById(taskId).pipe(
      catchError(this.handleError)
    );
    // Note: This would require getting current attachments and adding to them
    // Backend should probably have a dedicated endpoint for file uploads
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
  private buildFilterParams(params: HttpParams, filters?: TaskFilters): HttpParams {
    if (filters) {
      if (filters.projectId) params = params.set('projectId', filters.projectId);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.assigneeId) params = params.set('assigneeId', filters.assigneeId);
      if (filters.reporterId) params = params.set('reporterId', filters.reporterId);
      if (filters.parentTaskId) params = params.set('parentTaskId', filters.parentTaskId);
      if (filters.overdue !== undefined) params = params.set('overdue', filters.overdue.toString());
      if (filters.tags && filters.tags.length > 0) {
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

    console.error('TaskService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}