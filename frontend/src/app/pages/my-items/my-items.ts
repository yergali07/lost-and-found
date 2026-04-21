import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { ItemService } from '../../core/services/item.service';
import { Item } from '../../models/item.model';
import { ClaimResponse, ClaimService } from '../../core/services/claim.service';

@Component({
  selector: 'app-my-items',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe],
  templateUrl: './my-items.html',
})
export class MyItemsComponent implements OnInit {
  private itemService = inject(ItemService);
  private claimService = inject(ClaimService);

  items = signal<Item[]>([]);
  claimsByItem = signal<Record<number, ClaimResponse[]>>({});
  expandedItems = signal<Record<number, boolean>>({});
  actionLoading = signal<Record<number, boolean>>({});
  resolveLoading = signal<Record<number, boolean>>({});

  loading = signal(false);
  claimsLoading = signal(false);
  errorMessage = signal('');
  actionMessage = signal('');

  ngOnInit(): void {
    this.loadItems();
    this.loadClaims();
  }

  loadItems(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.itemService.getMyItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Failed to load your items.');
        this.loading.set(false);
      },
    });
  }

  loadClaims(): void {
    this.claimsLoading.set(true);

    this.claimService.getMyItemClaims().subscribe({
      next: (claims) => {
        const grouped: Record<number, ClaimResponse[]> = {};
        for (const claim of claims) {
          if (!grouped[claim.item]) {
            grouped[claim.item] = [];
          }
          grouped[claim.item].push(claim);
        }
        this.claimsByItem.set(grouped);
        this.claimsLoading.set(false);
      },
      error: (err) => {
        this.actionMessage.set(err?.error?.detail || 'Failed to load claims.');
        this.claimsLoading.set(false);
      },
    });
  }

  toggleClaims(itemId: number): void {
    this.expandedItems.update((state) => ({
      ...state,
      [itemId]: !state[itemId],
    }));
  }

  isExpanded(itemId: number): boolean {
    return !!this.expandedItems()[itemId];
  }

  getClaimsForItem(itemId: number): ClaimResponse[] {
    return this.claimsByItem()[itemId] || [];
  }

  onApprove(claimId: number): void {
    this.actionMessage.set('');
    this.setActionLoading(claimId, true);

    this.claimService
      .approveClaim(claimId)
      .pipe(finalize(() => this.setActionLoading(claimId, false)))
      .subscribe({
        next: (updatedClaim) => {
          this.applyClaimUpdate(updatedClaim);
          this.updateItemStatus(updatedClaim.item, 'claimed');
          this.actionMessage.set('Claim approved.');
        },
        error: (err) => {
          this.actionMessage.set(err?.error?.detail || 'Failed to approve claim.');
        },
      });
  }

  onReject(claimId: number): void {
    this.actionMessage.set('');
    this.setActionLoading(claimId, true);

    this.claimService
      .rejectClaim(claimId)
      .pipe(finalize(() => this.setActionLoading(claimId, false)))
      .subscribe({
        next: (updatedClaim) => {
          this.applyClaimUpdate(updatedClaim);
          this.actionMessage.set('Claim rejected.');
        },
        error: (err) => {
          this.actionMessage.set(err?.error?.detail || 'Failed to reject claim.');
        },
      });
  }

  onMarkResolved(itemId: number): void {
    this.actionMessage.set('');
    this.setResolveLoading(itemId, true);

    this.itemService
      .markResolved(itemId)
      .pipe(finalize(() => this.setResolveLoading(itemId, false)))
      .subscribe({
        next: (updatedItem) => {
          this.items.update((items) =>
            items.map((item) => (item.id === itemId ? updatedItem : item)),
          );
          this.actionMessage.set('Item marked as resolved.');
        },
        error: (err) => {
          this.actionMessage.set(err?.error?.detail || 'Failed to mark item as resolved.');
        },
      });
  }

  isClaimBusy(claimId: number): boolean {
    return !!this.actionLoading()[claimId];
  }

  isResolveBusy(itemId: number): boolean {
    return !!this.resolveLoading()[itemId];
  }

  private setActionLoading(claimId: number, loading: boolean): void {
    this.actionLoading.update((state) => ({
      ...state,
      [claimId]: loading,
    }));
  }

  private setResolveLoading(itemId: number, loading: boolean): void {
    this.resolveLoading.update((state) => ({
      ...state,
      [itemId]: loading,
    }));
  }

  private applyClaimUpdate(updatedClaim: ClaimResponse): void {
    this.claimsByItem.update((grouped) => {
      const itemClaims = grouped[updatedClaim.item] || [];
      const updatedItemClaims = itemClaims.map((claim) =>
        claim.id === updatedClaim.id ? updatedClaim : claim,
      );

      return {
        ...grouped,
        [updatedClaim.item]: updatedItemClaims,
      };
    });
  }

  private updateItemStatus(itemId: number, status: Item['status']): void {
    this.items.update((items) =>
      items.map((item) => (item.id === itemId ? { ...item, status } : item)),
    );
  }
}
