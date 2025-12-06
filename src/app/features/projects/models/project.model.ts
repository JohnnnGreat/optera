// src/app/features/projects/models/project.model.ts

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  color?: string;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  budget?: number;
  ownerId?: string;
  tenantId: string;
  tags?: string[];
  settings?: Record<string, any>;
  isOverdue: boolean;
  taskStats: TaskStats;
  createdAt: Date;
  updatedAt: Date;
  owner?: any; // User reference
  tasks?: any[]; // Task references
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  color?: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  budget?: number;
  ownerId?: string;
  tags?: string[];
  settings?: Record<string, any>;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  progress?: number;
  actualHours?: number;
  completedAt?: string;
}

export interface ProjectStatsDto {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  totalTasks: number;
  completedTasks: number;
  averageProgress: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  ownerId?: string;
  tags?: string[];
  overdue?: boolean;
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