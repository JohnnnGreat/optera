import { Routes } from '@angular/router';
import { guestGuard } from './guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((c) => c.LoginComponent),
    canActivate: [guestGuard],
    title: 'Login - FlowHub',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((c) => c.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Register - FlowHub',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(
        (c) => c.ForgotPasswordComponent
      ),
    canActivate: [guestGuard],
    title: 'Forgot Password - FlowHub',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(
        (c) => c.ResetPasswordComponent
      ),
    canActivate: [guestGuard],
    title: 'Reset Password - FlowHub',
  },
  {
    path: 'tenant',
    loadComponent: () =>
      import('./components/tenant-selection/tenant-selection.component').then(
        (c) => c.TenantSelectionComponent
      ),
    title: 'Select Workspace - FlowHub',
  },
];
