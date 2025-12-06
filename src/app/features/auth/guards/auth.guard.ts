import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn, CanMatchFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      } else {
        router.navigate(['/dashboard']);
        return false;
      }
    })
  );
};

export const authMatchGuard: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  
  return authService.isAuthenticated$.pipe(
    take(1)
  );
};

export const guestMatchGuard: CanMatchFn = (route, segments) => {
  const authService = inject(AuthService);
  
  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => !isAuthenticated)
  );
};