import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { ItemService } from '../../core/services/item.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private itemService = inject(ItemService);
  private claimService = inject(ClaimService);

  protected readonly me = signal<User | null>(null);
  protected readonly itemsCount = signal<number | null>(null);
  protected readonly claimsCount = signal<number | null>(null);
  protected readonly errorMessage = signal('');

  protected readonly passwordFormOpen = signal(false);
  protected readonly passwordSubmitting = signal(false);
  protected readonly passwordSuccess = signal('');
  protected readonly passwordErrors = signal<Record<string, string>>({});

  oldPassword = '';
  newPassword = '';
  newPasswordConfirm = '';

  protected readonly fullName = computed(() => {
    const user = this.me();
    if (!user) return '';
    const composed = `${user.first_name} ${user.last_name}`.trim();
    return composed || user.username;
  });

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (user) => this.me.set(user),
      error: () => this.errorMessage.set('Failed to load profile.'),
    });

    this.itemService.getMyItems().subscribe({
      next: (items) => this.itemsCount.set(items.length),
    });

    this.claimService.getMyClaims().subscribe({
      next: (claims) => this.claimsCount.set(claims.length),
    });
  }

  togglePasswordForm(): void {
    this.passwordFormOpen.update((open) => !open);
    this.passwordSuccess.set('');
    this.passwordErrors.set({});
  }

  onChangePassword(): void {
    if (this.passwordSubmitting()) return;

    this.passwordSubmitting.set(true);
    this.passwordSuccess.set('');
    this.passwordErrors.set({});

    this.authService
      .changePassword({
        old_password: this.oldPassword,
        new_password: this.newPassword,
        new_password_confirm: this.newPasswordConfirm,
      })
      .pipe(finalize(() => this.passwordSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.passwordSuccess.set('Password changed successfully.');
          this.oldPassword = '';
          this.newPassword = '';
          this.newPasswordConfirm = '';
        },
        error: (err: unknown) => {
          this.passwordErrors.set(this.extractErrors(err));
        },
      });
  }

  private extractErrors(err: unknown): Record<string, string> {
    const e = err as { error?: Record<string, unknown> };
    const body = e.error ?? {};
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (Array.isArray(value)) {
        result[key] = String(value[0] ?? '');
      } else if (typeof value === 'string') {
        result[key] = value;
      }
    }
    if (Object.keys(result).length === 0) {
      result['_'] = 'Failed to change password.';
    }
    return result;
  }
}
