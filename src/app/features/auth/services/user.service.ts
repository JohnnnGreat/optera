// src/app/auth/services/user.service.ts
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '../models/user.model';
import { ApiConfig } from '../../../core/configs/api.config';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = '/api/v1/users';
  private readonly apiConfig = inject(ApiConfig);

  /**
   * Create a new user
   * POST /api/v1/users
   */
  createUser(userData: CreateUserDto): Observable<User> {
    return this.http
      .post<User>(`${this.apiConfig.auth}`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all users with pagination
   * GET /api/v1/users
   */
  getAllUsers(params?: PaginationParams): Observable<User[]> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http
      .get<User[]>(`${this.API_BASE}`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiConfig.users}/me`).pipe(catchError(this.handleError));
  }

  /**
   * Update current user profile
   * PATCH /api/v1/users/me
   */
  updateCurrentUserProfile(userData: UpdateUserDto): Observable<User> {
    return this.http
      .patch<User>(`${this.API_BASE}/me`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get user by ID
   * GET /api/v1/users/{id}
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Update user by ID
   * PATCH /api/v1/users/{id}
   */
  updateUserById(id: string, userData: UpdateUserDto): Observable<User> {
    return this.http
      .patch<User>(`${this.API_BASE}/${id}`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete user (soft delete)
   * DELETE /api/v1/users/{id}
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Change current user password
   * POST /api/v1/users/change-password
   */
  changePassword(passwordData: ChangePasswordDto): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.API_BASE}/change-password`, passwordData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Change another user password (admin only)
   * POST /api/v1/users/{id}/change-password
   */
  changeUserPasswordById(
    id: string,
    passwordData: ChangePasswordDto
  ): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.API_BASE}/${id}/change-password`, passwordData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deactivate user
   * POST /api/v1/users/{id}/deactivate
   */
  deactivateUser(id: string): Observable<User> {
    return this.http
      .post<User>(`${this.API_BASE}/${id}/deactivate`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Activate user
   * POST /api/v1/users/{id}/activate
   */
  activateUser(id: string): Observable<User> {
    return this.http
      .post<User>(`${this.API_BASE}/${id}/activate`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload user avatar
   * POST /api/v1/users/me/avatar (custom endpoint)
   */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http
      .post<{ avatarUrl: string }>(`${this.API_BASE}/me/avatar`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Search users
   */
  searchUsers(searchTerm: string, limit: number = 10): Observable<User[]> {
    return this.getAllUsers({ search: searchTerm, limit });
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: string, params?: PaginationParams): Observable<User[]> {
    // This would require backend support for role filtering
    // For now, filter on frontend
    return this.getAllUsers(params).pipe(
      map((users) => users.filter((user) => user.roles!.includes(role as any)))
    );
  }

  /**
   * Get active users only
   */
  getActiveUsers(params?: PaginationParams): Observable<User[]> {
    return this.getAllUsers(params).pipe(map((users) => users.filter((user) => user.isActive)));
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage =
        error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('UserService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
