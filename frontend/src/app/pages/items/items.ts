import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './items.html',
})
export class ItemsComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  me: User | null = null;
  errorMessage = '';

  ngOnInit(): void {
    this.errorMessage = '';
    this.authService.getMe().subscribe({
      next: (me) => {
        this.me = me;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.detail || 'Failed to load /me. Are you logged in?';
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

