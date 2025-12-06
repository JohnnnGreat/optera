import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { TenantService } from '../../../tenants/services/tenant.service';
import { User } from '../../models/user.model';
import { Tenant } from '../../../tenants/models/tenant.model';

@Component({
  selector: 'app-tenant-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-selection.component.html',
})
export class TenantSelectionComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  currentUser: User | null = null;
  tenants: Tenant[] = [];
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  isSelecting = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUserTenants();
  }

  private loadUserTenants(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.tenantService.getMyTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants?.data as [];
        this.isLoading.set(false);
        console.log('User tenants loaded:ss', tenants, 'sdf');
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
        this.error.set('Failed to load tenants. Please try again.');
        this.isLoading.set(false);
        // Fallback to mock data for development
        this.tenants = this.getMockTenants();
      },
    });
  }

  private getMockTenants(): Tenant[] {
    return [
      {
        id: '1',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        description: 'Software development company',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Tenant,
      {
        id: '2',
        name: 'Tech Innovations Ltd',
        slug: 'tech-innovations',
        description: 'Technology consulting firm',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Tenant,
      {
        id: '3',
        name: 'Startup Hub',
        slug: 'startup-hub',
        description: 'Innovation workspace',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Tenant,
    ];
  }

  selectTenant(tenant: Tenant): void {
    if (this.isSelecting) return;

    this.isSelecting = true;
    console.log('Selecting tenant:', tenant);

    // Set the current tenant in the tenant service
    this.tenantService.setCurrentTenant(tenant);

    // Navigate to dashboard
    this.router.navigate(['/dashboard']).then(() => {
      console.log('Navigated to dashboard');
    });
  }

  retryLoadTenants(): void {
    this.loadUserTenants();
  }

  logout(): void {
    this.authService.logout();
  }

  contactSupport(): void {
    window.open('mailto:support@flowhub.com?subject=Workspace Access Request', '_blank');
  }

  getUserInitials(user: User): string {
    return (user.firstName!.charAt(0) + user.lastName!.charAt(0)).toUpperCase();
  }

  getTenantInitials(tenantName: string): string {
    const words = tenantName.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  trackByTenantId(index: number, tenant: Tenant): string {
    return tenant.id;
  }
}
