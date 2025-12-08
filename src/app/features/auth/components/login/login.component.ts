import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../models/auth.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../../../core/services/notification-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = signal<boolean>(false);

  // still used by your HTML for inline messages
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      this.notificationService.warning(
        'Invalid Form',
        'Please fill in all required fields correctly.'
      );

      return;
    }

    this.isLoading.set(true);
    this.errorMessage = '';
    this.successMessage = '';

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService
      .login(credentials)
      .pipe(
        catchError((error) => {
          const detail = error?.message || 'Invalid email or password. Please try again.';

          this.errorMessage = detail;
          this.notificationService.error('Login failed', detail);

          // Set loading to false here immediately for errors
          this.isLoading.set(false);

          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Login successful! Redirecting...';
          this.notificationService.success('Login successful', 'Redirecting to dashboard...');

          setTimeout(() => {
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          }, 1000);
        },
        error: (error) => {
          // This shouldn't be called since catchError handles it, but just in case
          console.error('Unexpected error:', error);
          this.isLoading.set(false);
        },
      });
  }
}
