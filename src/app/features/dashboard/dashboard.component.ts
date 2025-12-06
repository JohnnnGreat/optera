import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { UserService } from '../auth/services/user.service';
import { ProjectService } from '../projects/services/project.service';
import { TaskService } from '../tasks/services/task.service';
import { TenantService } from '../tenants/services/tenant.service';
import { User } from '../auth/models/user.model';
import { Project, ProjectStatsDto } from '../projects/models/project.model';
import { Task } from '../tasks/models/task.model';
import { Tenant } from '../tenants/models/tenant.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  // State signals
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  // Data
  currentUser: User | null = null;
  currentTenant: Tenant | null = null;
  projectStats = signal<ProjectStatsDto | null>(null);
  recentProjects = signal<Project[]>([]);
  myTasks = signal<Task[]>([]);
  overdueProjects = signal<Project[]>([]);
  overdueTasks = signal<Task[]>([]);

  // Quick stats computed properties
  get quickStats() {
    const stats = this.projectStats();
    return stats ? {
      projects: {
        total: stats.totalProjects,
        active: stats.activeProjects,
        completed: stats.completedProjects,
        overdue: stats.overdueProjects
      },
      tasks: {
        total: stats.totalTasks,
        completed: stats.completedTasks,
        average: stats.averageProgress
      }
    } : null;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentTenant = this.tenantService.getCurrentTenant();
    
    if (!this.currentTenant) {
      this.router.navigate(['/tenant-selection']);
      return;
    }

    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load all dashboard data in parallel
    Promise.all([
      this.loadProjectStats(),
      this.loadRecentProjects(),
      this.loadMyTasks(),
      this.loadOverdueProjects(),
      this.loadOverdueTasks()
    ]).then(() => {
      this.isLoading.set(false);
    }).catch((error) => {
      console.error('Error loading dashboard data:', error);
      this.error.set('Failed to load dashboard data');
      this.isLoading.set(false);
    });
  }

  private async loadProjectStats(): Promise<void> {
    try {
      const stats = await this.projectService.getProjectStats().toPromise();
      this.projectStats.set(stats!);
    } catch (error) {
      console.error('Error loading project stats:', error);
    }
  }

  private async loadRecentProjects(): Promise<void> {
    try {
      const response = await this.projectService.getAllProjects({ page: 1, limit: 5, sortBy: 'updatedAt', sortOrder: 'DESC' }).toPromise();
      this.recentProjects.set(response!.data);
    } catch (error) {
      console.error('Error loading recent projects:', error);
    }
  }

  private async loadMyTasks(): Promise<void> {
    try {
      const tasks = await this.taskService.getMyTasks().toPromise();
      this.myTasks.set(tasks?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading my tasks:', error);
    }
  }

  private async loadOverdueProjects(): Promise<void> {
    try {
      const projects = await this.projectService.getOverdueProjects().toPromise();
      this.overdueProjects.set(projects || []);
    } catch (error) {
      console.error('Error loading overdue projects:', error);
    }
  }

  private async loadOverdueTasks(): Promise<void> {
    try {
      const tasks = await this.taskService.getOverdueTasks().toPromise();
      this.overdueTasks.set(tasks || []);
    } catch (error) {
      console.error('Error loading overdue tasks:', error);
    }
  }

  // Navigation methods
  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToTasks(): void {
    this.router.navigate(['/tasks']);
  }

  navigateToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  navigateToTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  switchTenant(): void {
    this.router.navigate(['/tenant-selection']);
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // Helper methods
  getProjectProgress(project: Project): number {
    return project.progress || 0;
  }

  getProjectStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTaskStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
