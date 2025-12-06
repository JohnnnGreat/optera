// src/app/auth/models/user.model.ts
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: UserRole[];
  isActive: boolean;
  phone?: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  tenantId?: string;
  fullName?: string;
  tenants?: any[];
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: UserRole[];
  phone?: string;
  bio?: string;
  tenantId: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roles?: UserRole[];
  phone?: string;
  bio?: string;
  tenantId?: string;
  isActive?: boolean;
  avatar?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
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
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
