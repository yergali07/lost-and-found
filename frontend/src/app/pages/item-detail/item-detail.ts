import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { ItemService } from '../../core/services/item.service';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { Item } from '../../models/item.model';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './item-detail.html',
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private claimService = inject(ClaimService);

  protected readonly item = signal<Item | null>(null);
  protected readonly me = signal<User | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly loading = signal(true);
  protected readonly isLoggedIn = signal(false);
  claimMessage = '';
  claimSubmitting = false;
  claimSuccess = '';
  claimError = '';
  hasPendingClaim = false;

  protected readonly isOwner = computed(
    () => this.item() !== null && this.me() !== null && this.item()!.owner === this.me()!.id,
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (isNaN(id)) {
      this.router.navigate(['/items']);
      return;
    }

    this.isLoggedIn.set(this.authService.isLoggedIn());

    this.itemService.getItem(id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load item.');
        this.loading.set(false);
      },
    });

    this.authService.getMe().subscribe({
      next: (me) => {
        this.me.set(me);
      },
    });
  }

  onSubmitClaim(): void {
    const item = this.item();
    const message = this.claimMessage.trim();

    if (!item || !message || this.hasPendingClaim) {
      return;
    }

    this.claimError = '';
    this.claimSuccess = '';
    this.claimSubmitting = true;

    this.claimService
      .submitClaim(item.id, message)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.claimSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.hasPendingClaim = true;
          this.claimMessage = '';
          this.claimSuccess = 'Claim submitted successfully!';
        },
        error: (err: unknown) => {
          this.claimError = this.formatClaimError(err);
        },
      });
  }

  onDelete(): void {
    const item = this.item();
    if (!item || !confirm('Are you sure you want to delete this item?')) {
      return;
    }

    this.itemService.deleteItem(item.id).subscribe({
      next: () => this.router.navigate(['/items']),
      error: () => {
        this.errorMessage.set('Failed to delete item.');
      },
    });
  }

  private formatClaimError(err: unknown): string {
    const timeoutError = err as { name?: string };
    if (timeoutError.name === 'TimeoutError') {
      return 'The server is taking too long to respond. Please try again.';
    }

    const error = err as { error?: { detail?: string; [key: string]: unknown } };
    const detail = error.error?.detail;

    if (detail) {
      if (detail === 'You already have a pending claim for this item.') {
        this.hasPendingClaim = true;
        this.claimSuccess = 'A claim has already been submitted and is pending review.';
        return '';
      }

      return detail;
    }

    if (error.error && typeof error.error === 'object') {
      const messages: string[] = [];

      for (const value of Object.values(error.error)) {
        if (Array.isArray(value)) {
          messages.push(...value.map(String));
        } else if (value) {
          messages.push(String(value));
        }
      }

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    return 'Failed to submit claim. Please try again.';
  }
}
