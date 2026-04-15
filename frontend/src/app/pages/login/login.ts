import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest, RegisterRequest } from '../../models/auth.model';

export type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private routeDataSub?: Subscription;

  mode: AuthMode = 'login';

  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  errorMessage = '';

  readonly logoSrc = '/kbtu-logo.png';

  ngOnInit(): void {
    this.routeDataSub = this.route.data.subscribe((data) => {
      const m = data['mode'] as AuthMode | undefined;
      this.mode = m === 'register' ? 'register' : 'login';
      this.errorMessage = '';
    });
  }

  ngOnDestroy(): void {
    this.routeDataSub?.unsubscribe();
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.mode === 'register') {
      const data: RegisterRequest = {
        username: this.username,
        email: this.email,
        password: this.password,
        password_confirm: this.passwordConfirm,
      };
      this.authService.register(data).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (err: unknown) => {
          this.errorMessage = this.formatRegisterError(err);
        },
      });
      return;
    }

    const data: LoginRequest = {
      username: this.username,
      password: this.password,
    };
    this.authService.login(data).subscribe({
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
