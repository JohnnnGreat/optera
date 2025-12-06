// src/app/core/config/api.config.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ApiConfig {
  private readonly baseUrl = environment.apiUrl;
  private readonly version = environment.apiVersion;

  private buildUrl(path: string): string {
    return `${this.baseUrl}/api/${this.version}${path}`;
  }

  get auth(): string {
    return this.buildUrl('/auth');
  }

  get users(): string {
    return this.buildUrl('/users');
  }

  get tenants(): string {
    return this.buildUrl('/tenants');
  }

  get projects(): string {
    return this.buildUrl('/projects');
  }

  get tasks(): string {
    return this.buildUrl('/tasks');
  }
}