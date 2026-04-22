import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  errorMessage = '';
  readonly submitting = signal(false);

  readonly logoSrc = '/kbtu-logo.png';

  onSubmit(): void {
    if (this.submitting()) {
      return;
    }
    this.errorMessage = '';
    this.submitting.set(true);

    const data: LoginRequest = {
      username: this.username,
      password: this.password,
    };
    this.authService
      .login(data)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/items']);
        },
        error: (err: unknown) => {
          const e = err as { error?: { detail?: string } };
          const detail = e?.error?.detail;
          this.errorMessage = detail || 'Login failed. Please try again.';
        },
      });
  }
}
