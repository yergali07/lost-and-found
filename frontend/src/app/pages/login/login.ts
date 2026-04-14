import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';

    const data: LoginRequest = {
      username: this.username,
      password: this.password,
    };

    this.authService.login(data).subscribe({
      next: () => {
        this.router.navigate(['/items']);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Login failed. Please try again.';
      },
    });
  }
}
