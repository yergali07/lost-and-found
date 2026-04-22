import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CategoryService } from '../../core/services/category.service';
import { ItemService } from '../../core/services/item.service';
import { Category, ItemCreateRequest } from '../../models/item.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
})
export class ItemFormComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private itemService = inject(ItemService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = false;
  itemId: number | null = null;
  categories: Category[] = [];
  errorMessage = '';
  loading = false;

  title = '';
  description = '';
  location = '';
  category: number | null = null;
  itemType: 'lost' | 'found' = 'lost';
  dateLostOrFound = '';
  imageFile: File | null = null;
  imagePreview: string | null = null;
  clearImage = false;

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.errorMessage = 'Failed to load categories.';
      },
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.itemId = Number(idParam);
      this.loadItem(this.itemId);
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;

    const data: ItemCreateRequest = {
      title: this.title,
      description: this.description,
      item_type: this.itemType,
      location: this.location,
      date_lost_or_found: this.dateLostOrFound,
      category: this.category,
      image: this.imageFile,
      clearImage: this.clearImage,
    };

    const request = this.isEditMode
      ? this.itemService.updateItem(this.itemId!, data)
      : this.itemService.createItem(data);

    request.subscribe({
      next: () => {
        this.router.navigate(['/items']);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.formatError(err);
      },
    });
  }

  private loadItem(id: number): void {
    this.itemService.getItem(id).subscribe({
      next: (item) => {
        this.title = item.title;
        this.description = item.description;
        this.location = item.location;
        this.category = item.category;
        this.itemType = item.item_type;
        this.dateLostOrFound = item.date_lost_or_found;
        if (item.image) {
          this.imagePreview = item.image;
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load item.';
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
      this.clearImage = false;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  onClearImage(fileInput: HTMLInputElement): void {
    this.imageFile = null;
    this.imagePreview = null;
    this.clearImage = true;
    fileInput.value = '';
  }

  private formatError(err: unknown): string {
    const e = err as { error?: Record<string, unknown> };
    if (e.error && typeof e.error === 'object') {
      const messages: string[] = [];
      for (const key of Object.keys(e.error)) {
        const value = e.error[key];
        if (Array.isArray(value)) {
          messages.push(...value.map(String));
        } else {
          messages.push(String(value));
        }
      }
      return messages.join(' ');
    }
    return 'Something went wrong. Please try again.';
  }
}
