import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';
import { authGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  ...authRoutes,
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then((c) => c.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((c) => c.DashboardComponent),
        title: 'Dashboard - Optera',
      },
      {
        path: 'projects',
        loadChildren: () =>
          import('./features/projects/projects.routes').then((m) => m.projectRoutes),
      },
      { path: 'tasks', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'team', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'reports', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'settings', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
