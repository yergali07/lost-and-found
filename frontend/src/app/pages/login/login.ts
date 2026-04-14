import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

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
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode: AuthMode = 'login';

  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  errorMessage = '';

  readonly logoSrc = '/kbtu-logo.png';
  readonly fogSrc = '/kbtu-fog.png';

  ngOnInit(): void {
    const syncMode = (): void => {
      const m = this.route.snapshot.data['mode'] as AuthMode | undefined;
      this.mode = m === 'register' ? 'register' : 'login';
      this.errorMessage = '';
    };

    syncMode();
    this.route.data.subscribe(() => syncMode());
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => syncMode());
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
        const detail = (err as { error?: { detail?: string } })?.error?.detail;
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
