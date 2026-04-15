import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ItemService } from '../../core/services/item.service';
import { Item } from '../../models/item.model';
import { ItemCardComponent } from '../../shared/item-card/item-card';

@Component({
  selector: 'app-my-items',
  standalone: true,
  imports: [RouterLink, ItemCardComponent],
  templateUrl: './my-items.html',
})
export class MyItemsComponent implements OnInit {
  private itemService = inject(ItemService);

  items = signal<Item[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadItems();
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
}
