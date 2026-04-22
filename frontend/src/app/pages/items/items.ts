import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ItemService } from '../../core/services/item.service';
import { CategoryService } from '../../core/services/category.service';
import { Category, Item } from '../../models/item.model';
import { ItemCardComponent } from '../../shared/item-card/item-card';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [RouterLink, FormsModule, ItemCardComponent],
  templateUrl: './items.html',
  styleUrl: './items.css',
})
export class ItemsComponent implements OnInit {
  private itemService = inject(ItemService);
  private categoryService = inject(CategoryService);

  items = signal<Item[]>([]);
  categories = signal<Category[]>([]);

  loading = signal(false);
  errorMessage = signal('');

  page = signal(1);
  totalCount = signal(0);
  hasNext = signal(false);
  hasPrevious = signal(false);

  searchQuery = '';
  filterType: 'lost' | 'found' | '' = '';
  filterCategory: number | '' = '';
  filterStatus: 'active' | 'claimed' | 'resolved' | '' = '';

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });

    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.itemService
      .getItems({
        search: this.searchQuery,
        item_type: this.filterType,
        category: this.filterCategory,
        status: this.filterStatus,
        page: this.page(),
        page_size: PAGE_SIZE,
      })
      .subscribe({
        next: (response) => {
          this.items.set(response.results);
          this.totalCount.set(response.count);
          this.hasNext.set(response.next !== null);
          this.hasPrevious.set(response.previous !== null);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.detail || 'Failed to load items.');
          this.loading.set(false);
        },
      });
  }

  onSearchChange(): void {
    this.page.set(1);
    this.loadItems();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadItems();
  }

  nextPage(): void {
    if (this.hasNext()) {
      this.page.update((p) => p + 1);
      this.loadItems();
    }
  }

  previousPage(): void {
    if (this.hasPrevious()) {
      this.page.update((p) => Math.max(1, p - 1));
      this.loadItems();
    }
  }
}
