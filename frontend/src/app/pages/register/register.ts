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
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly submitting = signal(false);

  readonly logoSrc = '/kbtu-logo.png';

  private static readonly FIELD_KEYS = ['username', 'email', 'password', 'password_confirm'];

  onSubmit(): void {
    if (this.submitting()) {
      return;
    }
    this.errorMessage = '';
    this.fieldErrors.set({});
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
          this.applyError(err);
        },
      });
  }

  fieldError(key: string): string {
    return this.fieldErrors()[key] ?? '';
  }

  private applyError(err: unknown): void {
    const e = err as { error?: Record<string, unknown> };
    if (!e.error || typeof e.error !== 'object') {
      this.errorMessage = 'Registration failed. Please try again.';
      return;
    }

    const fields: Record<string, string> = {};
    const general: string[] = [];

    for (const key of Object.keys(e.error)) {
      const value = e.error[key];
      const msg = Array.isArray(value) ? value.map(String).join(' ') : String(value);
      if (RegisterComponent.FIELD_KEYS.includes(key)) {
        fields[key] = msg;
      } else {
        general.push(msg);
      }
    }

    this.fieldErrors.set(fields);
    this.errorMessage = general.join(' ');
  }
}
