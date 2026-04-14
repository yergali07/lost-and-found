import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';

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
      error: (err) => {
        if (err.error && typeof err.error === 'object') {
          const messages: string[] = [];
          for (const key of Object.keys(err.error)) {
            const value = err.error[key];
            if (Array.isArray(value)) {
              messages.push(...value);
            } else {
              messages.push(String(value));
            }
          }
          this.errorMessage = messages.join(' ');
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      },
    });
  }
}
