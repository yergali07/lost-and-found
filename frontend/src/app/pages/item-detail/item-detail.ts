import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { ItemService } from '../../core/services/item.service';
import { AuthService } from '../../core/services/auth.service';
import { ClaimService } from '../../core/services/claim.service';
import { CommentService } from '../../core/services/comment.service';
import { Item } from '../../models/item.model';
import { User } from '../../models/auth.model';
import { Comment } from '../../models/comment.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.css',
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);
  private claimService = inject(ClaimService);
  private commentService = inject(CommentService);

  protected readonly item = signal<Item | null>(null);
  protected readonly me = signal<User | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly loading = signal(true);
  protected readonly isLoggedIn = signal(false);
  protected readonly hasPendingClaim = signal(false);
  protected readonly deleting = signal(false);

  protected readonly comments = signal<Comment[]>([]);
  protected readonly commentsError = signal('');

  claimMessage = '';
  claimSubmitting = false;
  claimSuccess = '';
  claimError = '';

  commentInput = '';
  commentSubmitting = false;
  commentError = '';

  protected canDeleteComment(comment: Comment): boolean {
    const me = this.me();
    const item = this.item();
    if (!me || !item) return false;
    return comment.author === me.id || item.owner === me.id;
  }

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

    this.loadComments(id);

    this.authService.getMe().subscribe({
      next: (me) => this.me.set(me),
    });

    this.claimService.getMyClaims().subscribe({
      next: (claims) => {
        const alreadyPending = claims.some((c) => c.item === id && c.status === 'pending');
        if (alreadyPending) {
          this.hasPendingClaim.set(true);
          this.claimSuccess = 'You already have a pending claim for this item.';
        }
      },
    });
  }

  onSubmitClaim(): void {
    const item = this.item();
    const message = this.claimMessage.trim();

    if (!item || !message || this.hasPendingClaim()) {
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
          this.hasPendingClaim.set(true);
          this.claimMessage = '';
          this.claimSuccess = 'Claim submitted successfully!';
        },
        error: (err: unknown) => {
          this.claimError = this.formatClaimError(err);
        },
      });
  }

  private loadComments(itemId: number): void {
    this.commentService.listComments(itemId).subscribe({
      next: (comments) => this.comments.set(comments),
      error: () => this.commentsError.set('Failed to load comments.'),
    });
  }

  onSubmitComment(): void {
    const item = this.item();
    const content = this.commentInput.trim();
    if (!item || !content || this.commentSubmitting) {
      return;
    }

    this.commentError = '';
    this.commentSubmitting = true;

    this.commentService
      .createComment(item.id, content)
      .pipe(finalize(() => (this.commentSubmitting = false)))
      .subscribe({
        next: (comment) => {
          this.comments.update((list) => [...list, comment]);
          this.commentInput = '';
        },
        error: (err: unknown) => {
          const e = err as { error?: { content?: string[]; detail?: string } };
          this.commentError =
            e.error?.content?.[0] ?? e.error?.detail ?? 'Failed to post comment.';
        },
      });
  }

  onDeleteComment(commentId: number): void {
    if (!confirm('Delete this comment?')) {
      return;
    }
    this.commentService.deleteComment(commentId).subscribe({
      next: () => this.comments.update((list) => list.filter((c) => c.id !== commentId)),
      error: () => this.commentsError.set('Failed to delete comment.'),
    });
  }

  onDelete(): void {
    const item = this.item();
    if (!item || this.deleting() || !confirm('Are you sure you want to delete this item?')) {
      return;
    }

    this.deleting.set(true);
    this.itemService
      .deleteItem(item.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
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
        this.hasPendingClaim.set(true);
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
