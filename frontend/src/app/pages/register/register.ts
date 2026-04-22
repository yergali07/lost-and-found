import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  errorMessage = '';
  readonly submitting = signal(false);

  readonly logoSrc = '/kbtu-logo.png';

  onSubmit(): void {
    if (this.submitting()) {
      return;
    }
    this.errorMessage = '';
    this.submitting.set(true);

    const data: RegisterRequest = {
      username: this.username,
      email: this.email,
      password: this.password,
      password_confirm: this.passwordConfirm,
    };
    this.authService
      .register(data)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (err: unknown) => {
          this.errorMessage = this.formatRegisterError(err);
        },
      });
  }

  private formatRegisterError(err: unknown): string {
    const e = err as { error?: Record<string, unknown> };
    if (e.error && typeof e.error === 'object') {
      const messages: string[] = [];
      for (const key of Object.keys(e.error)) {
        const value = e.error[key];
        if (Array.isArray(value)) {
          messages.push(...value.map(String));
        } else {
          messages.push(String(value));
        }
      }
      return messages.join(' ');
    }
    return 'Registration failed. Please try again.';
  }
}
