// @ts-nocheck
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus, CreateProjectDto } from '../../models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // State signals
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  projects = signal<Project[]>([]);
  showCreateForm = signal<boolean>(false);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  pageSize = 10;

  // Filter form
  filterForm: FormGroup;
  statusOptions: { value: any | ''; label: string }[] = [
    { value: '', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Create form
  createForm: FormGroup;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      sortBy: ['updatedAt'],
      sortOrder: ['DESC'],
    });

    this.createForm = this.fb.group({
      name: [''],
      description: [''],
      startDate: [''],
      endDate: [''],
      status: ['planning'],
    });
  }

  ngOnInit(): void {
    this.loadProjects();

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadProjects();
    });
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filters: any = {
      page: this.currentPage(),
      limit: this.pageSize,
      ...this.filterForm.value,
    };

    this.projectService.getAllProjects(filters).subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.totalPages.set(response.meta.totalPages);
        this.totalItems.set(response.meta.totalItems);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.error.set('Failed to load projects');
        this.isLoading.set(false);
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadProjects();
  }

  onCreateProject(): void {
    if (this.createForm.valid) {
      const createData: CreateProjectDto = this.createForm.value;

      this.projectService.createProject(createData).subscribe({
        next: (project) => {
          this.showCreateForm.set(false);
          this.createForm.reset({ status: 'planning' });
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error creating project:', error);
          this.error.set('Failed to create project');
        },
      });
    }
  }

  onDeleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          this.error.set('Failed to delete project');
        },
      });
    }
  }

  navigateToProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  navigateToEditProject(projectId: string): void {
    this.router.navigate(['/projects', projectId, 'edit']);
  }

  getStatusColor(status: ProjectStatus): string {
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

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
  }
}
