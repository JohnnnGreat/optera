// src/app/shared/components/layout/layout.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { TenantService } from '../../../features/tenants/services/tenant.service';
import { User } from '../../../features/auth/models/user.model';
import { Tenant } from '../../../features/tenants/models/tenant.model';
import { filter } from 'rxjs/operators';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  // State
  currentUser: User | null = null;
  currentTenant: Tenant | null = null;
  sidebarOpen = signal<boolean>(false);
  currentRoute = signal<string>('');

  // Navigation items
  navigationItems: NavItem[] = [
    {
      name: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
    },
    {
      name: 'Projects',
      icon: 'folder',
      route: '/projects',
    },
    {
      name: 'Tasks',
      icon: 'check-square',
      route: '/tasks',
    },
    {
      name: 'Team',
      icon: 'users',
      route: '/team',
    },
    {
      name: 'Reports',
      icon: 'bar-chart',
      route: '/reports',
    },
    {
      name: 'Settings',
      icon: 'settings',
      route: '/settings',
    },
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentTenant = this.tenantService.getCurrentTenant();

    // Track current route for active navigation highlighting
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute.set(event.url);
      });

    // Set initial route
    this.currentRoute.set(this.router.url);

    // Subscribe to tenant changes
    this.tenantService.currentTenant$.subscribe((tenant) => {
      this.currentTenant = tenant;
    });

    // Redirect if no tenant is selected
    if (!this.currentTenant) {
      this.router.navigate(['/tenant-selection']);
    }
  }

  // Sidebar methods
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  // Navigation methods
  navigateTo(route: string): void {
    console.log(route, 'this is routes');
    this.router.navigate([route]);
    this.closeSidebar();
  }

  isActiveRoute(route: string): boolean {
    if (route === '/dashboard') {
      return this.currentRoute() === '/dashboard' || this.currentRoute() === '/';
    }
    return this.currentRoute().startsWith(route);
  }

  // User actions
  switchTenant(): void {
    this.router.navigate(['/tenant-selection']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Force logout even if API call fails
        this.router.navigate(['/login']);
      },
    });
  }

  // Helper methods
  getInitials(name: string): string {
    return (
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??'
    );
  }

  getUserInitials(): string {
    if (!this.currentUser) return '??';
    return `${this.currentUser.firstName?.[0] || ''}${
      this.currentUser.lastName?.[0] || ''
    }`.toUpperCase();
  }

  getTenantInitials(): string {
    return this.currentTenant ? this.getInitials(this.currentTenant.name) : '??';
  }

  // Icon mapping
  getIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      home: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>`,
      folder: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>`,
      'check-square': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8m9-4V5a2 2 0 00-2-2H9.5a2 2 0 00-2 2v5.5m0 0V15a2 2 0 002 2h8"/>
      </svg>`,
      users: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
      </svg>`,
      'bar-chart': `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>`,
      settings: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>`,
    };
    return icons[iconName] || icons['home'];
  }
}
