import { Routes } from '@angular/router';
import { Component } from '@angular/core';

// Simple test component
@Component({
  selector: 'app-test',
  standalone: true,
  template: `
    <div style="padding: 20px; text-align: center;">
      <h1>FlowHub Authentication Test</h1>
      <p>If you see this, routing is working!</p>
      <a href="/login" style="color: blue; text-decoration: underline;">Go to Login</a>
    </div>
  `
})
export class TestComponent {}

export const routes: Routes = [
  { path: '', redirectTo: '/test', pathMatch: 'full' },
  { path: 'test', component: TestComponent },
  { path: 'login', component: TestComponent },
  { path: '**', redirectTo: '/test' }
];