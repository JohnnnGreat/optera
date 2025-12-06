import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth.service';
import { TenantService } from '../../features/tenants/services/tenant.service';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);

  // Skip token attachment for auth-related requests to avoid circular calls
  if (isAuthRequest(req.url)) {
    console.log('🔐 AuthInterceptor: Skipping token for auth request:', req.url);
    return next(req);
  }

  // Add auth token and tenant ID to the request
  const authReq = addHeadersToRequest(req, authService, tenantService);
  console.log('🔐 AuthInterceptor: Headers attached to request:', req.url);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 unauthorized errors by attempting token refresh
      if (error.status === 401) {
        console.log('🔐 AuthInterceptor: 401 error, attempting token refresh');
        return handle401Error(authReq, next, authService, tenantService);
      }

      return throwError(() => error);
    })
  );
}

/**
 * Add access token and tenant ID to request headers
 */
function addHeadersToRequest(
  req: HttpRequest<any>,
  authService: AuthService,
  tenantService: TenantService
): HttpRequest<any> {
  const token = authService.getToken();
  const tenantId = tenantService.getCurrentTenantId();

  const headers: { [key: string]: string } = {};

  if (token) {
    console.log('🔑 Adding Authorization header with token:', token.substring(0, 20) + '...');
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantId) {
    console.log('🏢 Adding x-tenant-id header:', tenantId);
    headers['x-tenant-id'] = tenantId;
  }

  if (Object.keys(headers).length > 0) {
    return req.clone({ setHeaders: headers });
  }

  console.log('❌ No token or tenant ID available for request');
  return req;
}

/**
 * Legacy function for backward compatibility
 */
function addTokenToRequest(req: HttpRequest<any>, authService: AuthService): HttpRequest<any> {
  const token = authService.getToken();

  if (token) {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return req;
}

/**
 * Handle 401 Unauthorized errors
 */
function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  tenantService: TenantService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (refreshToken) {
      return authService.refreshToken().pipe(
        switchMap((response: any) => {
          isRefreshing = false;
          refreshTokenSubject.next(response.data.accessToken);

          // Retry the original request with new token
          return next(addHeadersToRequest(req, authService, tenantService));
        }),
        catchError((error) => {
          isRefreshing = false;
          authService.logout();
          return throwError(() => error);
        })
      );
    } else {
      // No refresh token available, logout user
      isRefreshing = false;
      authService.logout();
      return throwError(() => new Error('No refresh token available'));
    }
  }

  // If already refreshing, wait for the new token
  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap(() => next(addHeadersToRequest(req, authService, tenantService)))
  );
}

/**
 * Check if the request is for authentication endpoints
 */
function isAuthRequest(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}
