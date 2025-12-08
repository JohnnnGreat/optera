import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../../tasks/services/task.service';
import {
  Project,
  ProjectStatus,
  ProjectPriority,
  UpdateProjectDto,
} from '../../models/project.model';
import { Task, TaskStatus, TaskPriority, CreateTaskDto } from '../../../tasks/models/task.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly fb = inject(FormBuilder);

  // State signals
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // UI state
  isEditing = signal<boolean>(false);
  showTaskForm = signal<boolean>(false);
  selectedTab = signal<'overview' | 'tasks' | 'timeline' | 'settings' | any>('overview');

  // Forms
  editForm: FormGroup;
  taskForm: FormGroup;

  // Enums
  readonly ProjectStatus = ProjectStatus;
  readonly ProjectPriority = ProjectPriority;
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;

  projectId = '';

  constructor() {
    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      status: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      startDate: [''],
      dueDate: [''],
      estimatedHours: [''],
      budget: [''],
    });

    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      priority: ['medium'],
      dueDate: [''],
      estimatedHours: [''],
      assigneeId: [''],
    });
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.loadProject();
      this.loadTasks();
    }
  }

  loadProject(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
        this.populateEditForm(project);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.error.set('Failed to load project details.');
        this.isLoading.set(false);
      },
    });
  }

  loadTasks(): void {
    this.taskService.getAllTasks({ limit: 100 }, { projectId: this.projectId }).subscribe({
      next: (response) => {
        this.tasks.set(response.data);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      },
    });
  }

  populateEditForm(project: Project): void {
    this.editForm.patchValue({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: project.estimatedHours,
      budget: project.budget,
    });
  }

  // Tab navigation
  setActiveTab(tab: 'overview' | 'tasks' | 'timeline' | 'settings' | any): void {
    this.selectedTab.set(tab);
  }

  // Project editing
  enableEdit(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    const project = this.project();
    if (project) {
      this.populateEditForm(project);
    }
    this.isEditing.set(false);
  }

  saveProject(): void {
    if (this.editForm.valid && this.project()) {
      const updateData: UpdateProjectDto = this.editForm.value;

      this.projectService.updateProject(this.projectId, updateData).subscribe({
        next: (updatedProject) => {
          this.project.set(updatedProject);
          this.isEditing.set(false);
        },
        error: (error) => {
          console.error('Error updating project:', error);
          alert('Failed to update project. Please try again.');
        },
      });
    }
  }

  deleteProject(): void {
    const project = this.project();
    if (
      project &&
      confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)
    ) {
      this.projectService.deleteProject(this.projectId).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (error) => {
          console.error('Error deleting project:', error);
          alert('Failed to delete project. Please try again.');
        },
      });
    }
  }

  completeProject(): void {
    this.projectService.completeProject(this.projectId).subscribe({
      next: (updatedProject) => {
        this.project.set(updatedProject);
      },
      error: (error) => {
        console.error('Error completing project:', error);
        alert('Failed to complete project. Please try again.');
      },
    });
  }

  // Task management
  createTask(): void {
    if (this.taskForm.valid) {
      const taskData: CreateTaskDto = {
        ...this.taskForm.value,
        projectId: this.projectId,
      };

      this.taskService.createTask(taskData).subscribe({
        next: () => {
          this.taskForm.reset({ priority: 'medium' });
          this.showTaskForm.set(false);
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error creating task:', error);
          alert('Failed to create task. Please try again.');
        },
      });
    }
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
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

  updateTaskStatus(taskId: string, status: TaskStatus): void {
    this.taskService.updateTask(taskId, { status }).subscribe({
      next: () => {
        this.loadTasks();
        // Optionally refresh project to update progress
        this.loadProject();
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        alert('Failed to update task status. Please try again.');
      },
    });
  }

  // Navigation
  navigateToTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId]);
  }

  navigateToEditTask(taskId: string): void {
    this.router.navigate(['/tasks', taskId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  // Utility methods
  getStatusColor(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'bg-green-100 text-green-800 border-green-200';
      case ProjectStatus.PLANNING:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ProjectStatus.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ProjectStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case ProjectStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getPriorityColor(priority: ProjectPriority): string {
    switch (priority) {
      case ProjectPriority.LOW:
        return 'bg-green-100 text-green-800';
      case ProjectPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case ProjectPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case ProjectPriority.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTaskStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.IN_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTaskPriorityColor(priority: TaskPriority): string {
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

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  isOverdue(): boolean {
    const project = this.project();
    return project ? project.isOverdue : false;
  }

  getDaysUntilDue(): number | null {
    const project = this.project();
    if (!project?.dueDate) return null;

    const dueDate = new Date(project.dueDate);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
