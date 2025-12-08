// src/app/features/tasks/models/task.model.ts

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  position: number;
  projectId: string;
  assigneeId?: string;
  reporterId?: string;
  parentTaskId?: string;
  tags?: string[];
  isOverdue: boolean;
  checklistProgress: ChecklistProgress;
  checklist?: ChecklistItem[];
  attachments?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  project?: any;
  assignee?: any;
  reporter?: any;
  parentTask?: any;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  assigneeId?: string;
  reporterId?: string;
  parentTaskId?: string;
  tags?: string[];
  checklist?: ChecklistItem[];
  metadata?: Record<string, any>;
  position?: number;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  actualHours?: number;
  completedAt?: string;
  attachments?: string[];
}

export interface UpdateTaskPositionDto {
  projectId?: string;
  position: number;
}

export interface BulkUpdateTasksDto {
  taskIds: string[];
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
  tags?: string[];
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  reporterId?: string;
  parentTaskId?: string;
  tags?: string[];
  overdue?: boolean;
  priority?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}
