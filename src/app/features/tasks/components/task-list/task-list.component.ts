import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../../projects/services/project.service';
import {
  Task,
  TaskStatus,
  TaskPriority,
  PaginationParams,
  TaskFilters,
  CreateTaskDto,
} from '../../models/task.model';
import { Project } from '../../../projects/models/project.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './task-list.component.html',
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // State signals
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  pageSize = 20;

  // Filters
  filterForm: FormGroup;
  currentFilters = signal<TaskFilters>({});
  searchTerm = signal<string>('');

  // UI State
  selectedTasks = signal<Set<string>>(new Set());
  showBulkActions = computed(() => this.selectedTasks().size > 0);
  viewMode = signal<'list' | 'board'>('list');
  showCreateForm = signal<boolean>(false);

  // Create form
  createForm: FormGroup;

  // Enums for templates
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      projectId: [''],
      assigneeId: [''],
      overdue: [''],
      sortBy: ['updatedAt'],
      sortOrder: ['DESC'],
    });

    this.createForm = this.fb.group({
      title: [''],
      description: [''],
      projectId: [''],
      priority: ['medium'],
      dueDate: [''],
      estimatedHours: [''],
    });

    // Subscribe to search changes with debounce
    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.searchTerm.set(value || '');
        this.loadTasks();
      });

    // Subscribe to other filter changes
    ['status', 'priority', 'projectId', 'assigneeId', 'overdue', 'sortBy', 'sortOrder'].forEach(
      (field) => {
        this.filterForm.get(field)?.valueChanges.subscribe(() => {
          this.loadTasks();
        });
      }
    );
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects(): void {
    this.projectService.getAllProjects({ limit: 100 }).subscribe({
      next: (response) => {
        this.projects.set(response.data);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      },
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const pagination: PaginationParams = {
      page: this.currentPage(),
      limit: this.pageSize,
      search: this.searchTerm(),
      sortBy: this.filterForm.get('sortBy')?.value || 'updatedAt',
      sortOrder: this.filterForm.get('sortOrder')?.value || 'DESC',
    };

    const filters: TaskFilters = {
      status: this.filterForm.get('status')?.value || undefined,
      priority: this.filterForm.get('priority')?.value || undefined,
      projectId: this.filterForm.get('projectId')?.value || undefined,
      assigneeId: this.filterForm.get('assigneeId')?.value || undefined,
      overdue:
        this.filterForm.get('overdue')?.value === 'true'
          ? true
          : this.filterForm.get('overdue')?.value === 'false'
          ? false
          : undefined,
    };

    // Remove empty filters
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof TaskFilters] === '' || filters[key as keyof TaskFilters] === null) {
        delete filters[key as keyof TaskFilters];
      }
    });

    this.currentFilters.set(filters);

    this.taskService.getAllTasks(pagination, filters).subscribe({
      next: (response) => {
        this.tasks.set(response.data);
        this.totalPages.set(response.meta.lastPage);
        this.totalItems.set(response.meta.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.error.set('Failed to load tasks. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  // Navigation
  navigateToTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  createNewTask(): void {
    this.showCreateForm.set(true);
  }

  editTask(taskId: string, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/tasks', taskId, 'edit']);
  }

  // Task actions
  deleteTask(task: Task, event?: Event): void {
    event?.stopPropagation();

    if (confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          alert('Failed to delete task. Please try again.');
        },
      });
    }
  }

  updateTaskStatus(task: Task, status: TaskStatus, event?: Event): void {
    event?.stopPropagation();

    this.taskService.updateTask(task.id, { status }).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
      },
    });
  }

  createTask(): void {
    if (this.createForm.valid) {
      const taskData: CreateTaskDto = this.createForm.value;

      this.taskService.createTask(taskData).subscribe({
        next: () => {
          this.createForm.reset({ priority: 'medium' });
          this.showCreateForm.set(false);
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error creating task:', error);
          alert('Failed to create task. Please try again.');
        },
      });
    }
  }

  // Selection
  toggleTaskSelection(taskId: string, event?: Event): void {
    event?.stopPropagation();
    const selected = new Set(this.selectedTasks());

    if (selected.has(taskId)) {
      selected.delete(taskId);
    } else {
      selected.add(taskId);
    }

    this.selectedTasks.set(selected);
  }

  selectAllTasks(): void {
    const allIds = new Set(this.tasks().map((t) => t.id));
    this.selectedTasks.set(allIds);
  }

  clearSelection(): void {
    this.selectedTasks.set(new Set());
  }

  // Bulk actions
  bulkUpdateStatus(status: TaskStatus): void {
    const selected = this.selectedTasks();
    if (selected.size === 0) return;

    const updatePromises = Array.from(selected).map((id) =>
      this.taskService.updateTask(id, { status }).toPromise()
    );

    Promise.all(updatePromises)
      .then(() => {
        this.clearSelection();
        this.loadTasks();
      })
      .catch((error) => {
        console.error('Error in bulk status update:', error);
        alert('Some tasks could not be updated. Please try again.');
      });
  }

  bulkDelete(): void {
    const selected = this.selectedTasks();
    if (selected.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selected.size} task(s)? This action cannot be undone.`
      )
    ) {
      const deletePromises = Array.from(selected).map((id) =>
        this.taskService.deleteTask(id).toPromise()
      );

      Promise.all(deletePromises)
        .then(() => {
          this.clearSelection();
          this.loadTasks();
        })
        .catch((error) => {
          console.error('Error in bulk delete:', error);
          alert('Some tasks could not be deleted. Please try again.');
        });
    }
  }

  // Pagination
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTasks();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  // View toggle
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'list' ? 'board' : 'list');
  }

  // Clear filters
  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      priority: '',
      projectId: '',
      assigneeId: '',
      overdue: '',
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    });
    this.loadTasks();
  }

  // Board view helpers
  getTasksByStatus(): { [key in TaskStatus]: Task[] } {
    const tasksByStatus: { [key in TaskStatus]: Task[] } = {
      [TaskStatus.PENDING]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
    };

    this.tasks().forEach((task) => {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push(task);
      }
    });

    return tasksByStatus;
  }

  // Utility methods
  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case TaskStatus.IN_REVIEW:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  isTaskOverdue(task: Task): boolean {
    return task.isOverdue && task.status !== TaskStatus.COMPLETED;
  }

  getProjectName(projectId: string): string {
    const project = this.projects().find((p) => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  }

  getDaysUntilDue(dueDate: Date): number {
    const due = new Date(dueDate);
    const today = new Date();
    const timeDiff = due.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
