import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { RegisterData } from '../../models/auth.model';
import { NotificationService } from '../../../../core/services/notification-service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ToastModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  registerForm!: FormGroup;

  // Using signals
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        acceptedTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      this.notificationService.warning(
        'Invalid Form',
        'Please fill in all required fields correctly.'
      );

      return;
    }

    this.isLoading.set(true);

    const registerData: RegisterData = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      firstName: this.registerForm.value.firstName,
      lastName: this.registerForm.value.lastName,
    };

    this.authService
      .register(registerData)
      .pipe(
        tap(() => {
          // Success notification
          this.notificationService.success(
            'Account Created',
            'Your account has been created successfully!'
          );
        }),
        catchError((error) => {
          // Error notification
          const errorMessage = error?.message || 'Failed to create account. Please try again.';

          this.notificationService.error('Registration Failed', errorMessage);

          this.isLoading.set(false);
          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          // Navigate after short delay to show success message
          setTimeout(() => {
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
      });
  }

  // Helper methods for template validation
  get firstNameError(): string {
    const control = this.registerForm.get('firstName');
    if (control?.hasError('required') && control.touched) {
      return 'First name is required';
    }
    return '';
  }

  get lastNameError(): string {
    const control = this.registerForm.get('lastName');
    if (control?.hasError('required') && control.touched) {
      return 'Last name is required';
    }
    return '';
  }

  get emailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required') && control.touched) {
      return 'Email is required';
    }
    if (control?.hasError('email') && control.touched) {
      return 'Please enter a valid email';
    }
    return '';
  }

  get passwordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required') && control.touched) {
      return 'Password is required';
    }
    if (control?.hasError('minlength') && control.touched) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required') && control.touched) {
      return 'Please confirm your password';
    }
    if (this.registerForm.hasError('passwordMismatch') && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  get termsError(): string {
    const control = this.registerForm.get('acceptedTerms');
    if (control?.hasError('required') && control.touched) {
      return 'You must accept the terms and conditions';
    }
    return '';
  }
}
