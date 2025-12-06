// src/app/auth/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
  RefreshTokenRequest,
  LogoutRequest,
  ApiError,
} from '../models/auth.model';
import { ApiConfig } from '../../../core/configs/api.config';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiConfig = inject(ApiConfig);

  private readonly TOKEN_KEY = 'flowhub_access_token';
  private readonly REFRESH_TOKEN_KEY = 'flowhub_refresh_token';
  private readonly USER_KEY = 'flowhub_user';

  // BehaviorSubjects for reactive state management
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {}

  /**
   * User login
   * POST /api/v1/auth/login
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiConfig.auth}/login`, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  /**
   * User registration
   * POST /api/v1/auth/register
   */
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiConfig.auth}/register`, data).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => ({ message: 'No refresh token available' }));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<AuthResponse>(`${this.apiConfig.auth}/refresh`, request).pipe(
      tap((response) => this.handleTokenRefresh(response)),
      catchError((error) => {
        // If refresh fails, logout user
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword(data: ForgotPasswordData): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiConfig.auth}/forgot-password`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword(data: ResetPasswordData): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiConfig.auth}/reset-password`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * User logout
   * POST /api/v1/auth/logout
   */
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();

    // Call backend logout endpoint if refresh token exists
    if (refreshToken) {
      const request: LogoutRequest = { refreshToken };

      return this.http.post<void>(`${this.apiConfig.auth}/logout`, request).pipe(
        tap(() => this.clearAuthData()),
        catchError(() => {
          // Clear local data even if API call fails
          this.clearAuthData();
          return throwError(() => ({ message: 'Logout failed' }));
        })
      );
    }

    // If no refresh token, just clear local data
    this.clearAuthData();
    return new Observable((observer) => {
      observer.next();
      observer.complete();
    });
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Update current user (e.g., after profile update)
   */
  updateCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: AuthResponse): void {
    const { data } = response;

    const { accessToken, refreshToken, user } = data;

    // Store tokens
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);

    // Store user
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Update observables
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Handle token refresh
   */
  private handleTokenRefresh(response: AuthResponse): void {
    const { data } = response;

    const { accessToken, refreshToken } = data;
    // Update tokens
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  /**
   * Check if valid token exists
   */
  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token;
  }

  /**
   * Error handler
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      const apiError = error.error as ApiError;
      errorMessage = apiError.message || `Server error: ${error.status}`;
    }

    console.error('AuthService Error:', errorMessage);
    return throwError(() => ({ message: errorMessage, errors: error.error?.errors }));
  };
}
