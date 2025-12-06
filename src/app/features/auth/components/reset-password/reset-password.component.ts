import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ResetPasswordData } from '../../models/auth.model';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  resetPasswordForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  passwordReset = false;
  errorMessage = '';
  successMessage = '';
  resetToken = '';
  isValidToken = true;

  ngOnInit(): void {
    this.initializeForm();
    this.extractResetToken();
  }

  private initializeForm(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private extractResetToken(): void {
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'];
      if (!this.resetToken) {
        this.isValidToken = false;
      }
    });
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
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.isValidToken) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const resetPasswordData: ResetPasswordData = {
        token: this.resetToken,
        password: this.resetPasswordForm.value.password,
        confirmPassword: this.resetPasswordForm.value.confirmPassword
      };

      this.authService.resetPassword(resetPasswordData)
        .pipe(
          catchError(error => {
            this.errorMessage = error.message;
            if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('expired')) {
              this.isValidToken = false;
            }
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.passwordReset = true;
            this.successMessage = response.message || 'Your password has been reset successfully!';
          }
        });
    }
  }
}