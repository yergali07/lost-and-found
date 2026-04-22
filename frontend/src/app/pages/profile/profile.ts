import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { ItemService } from '../../core/services/item.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink],
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
}
