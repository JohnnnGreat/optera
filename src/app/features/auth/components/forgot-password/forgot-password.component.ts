import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ForgotPasswordData } from '../../models/auth.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  forgotPasswordForm!: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage = '';
  successMessage = '';
  submittedEmail = '';

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const forgotPasswordData: ForgotPasswordData = {
        email: this.forgotPasswordForm.value.email
      };

      this.submittedEmail = forgotPasswordData.email;

      this.authService.forgotPassword(forgotPasswordData)
        .pipe(
          catchError(error => {
            this.errorMessage = error.message;
            return EMPTY;
          }),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.emailSent = true;
            this.successMessage = response.message || 'Password reset link has been sent to your email.';
          }
        });
    }
  }

  resetForm(): void {
    this.emailSent = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.submittedEmail = '';
    this.forgotPasswordForm.reset();
  }
}