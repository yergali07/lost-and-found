import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ItemService } from '../../core/services/item.service';
import { CategoryService } from '../../core/services/category.service';
import { User } from '../../models/auth.model';
import { Category, Item } from '../../models/item.model';
import { ItemCardComponent } from '../../shared/item-card/item-card';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [RouterLink, FormsModule, ItemCardComponent],
  templateUrl: './items.html',
})
export class ItemsComponent implements OnInit {
  private authService = inject(AuthService);
  private itemService = inject(ItemService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  me = signal<User | null>(null);
  items = signal<Item[]>([]);
  categories = signal<Category[]>([]);

  loading = signal(false);
  errorMessage = signal('');

  searchQuery = '';
  filterType = '';
  filterCategory = '';
  filterStatus = '';

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (me) => this.me.set(me),
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Failed to load user info.');
      },
    });

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
      })
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.detail || 'Failed to load items.');
          this.loading.set(false);
        },
      });
  }

  onSearchChange(): void {
    this.loadItems();
  }

  onFilterChange(): void {
    this.loadItems();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}
