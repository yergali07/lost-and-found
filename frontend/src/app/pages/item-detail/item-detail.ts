import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';

import { ItemService } from '../../core/services/item.service';
import { AuthService } from '../../core/services/auth.service';
import { Item } from '../../models/item.model';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, TitleCasePipe],
  templateUrl: './item-detail.html',
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemService = inject(ItemService);
  private authService = inject(AuthService);

  protected readonly item = signal<Item | null>(null);
  protected readonly me = signal<User | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly loading = signal(true);

  protected readonly isOwner = computed(
    () => this.item() !== null && this.me() !== null && this.item()!.owner === this.me()!.id,
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

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
}
