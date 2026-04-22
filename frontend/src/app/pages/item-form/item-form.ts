import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

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
  readonly categories = signal<Category[]>([]);
  readonly errorMessage = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly loading = signal(false);

  private static readonly FIELD_KEYS = [
    'title',
    'description',
    'location',
    'category',
    'item_type',
    'date_lost_or_found',
    'image',
  ];

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
      next: (categories) => this.categories.set(categories),
      error: () => this.errorMessage.set('Failed to load categories.'),
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.itemId = Number(idParam);
      this.loadItem(this.itemId);
    }
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }
    this.errorMessage.set('');
    this.fieldErrors.set({});
    this.loading.set(true);

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

    request.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => {
        this.router.navigate(['/items']);
      },
      error: (err: unknown) => {
        this.applyError(err);
      },
    });
  }

  fieldError(key: string): string {
    return this.fieldErrors()[key] ?? '';
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
      error: () => this.errorMessage.set('Failed to load item.'),
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

  private applyError(err: unknown): void {
    const e = err as { error?: Record<string, unknown> };
    if (!e.error || typeof e.error !== 'object') {
      this.errorMessage.set('Something went wrong. Please try again.');
      return;
    }

    const fields: Record<string, string> = {};
    const general: string[] = [];

    for (const key of Object.keys(e.error)) {
      const value = e.error[key];
      const msg = Array.isArray(value) ? value.map(String).join(' ') : String(value);
      if (ItemFormComponent.FIELD_KEYS.includes(key)) {
        fields[key] = msg;
      } else {
        general.push(msg);
      }
    }

    this.fieldErrors.set(fields);
    this.errorMessage.set(general.join(' '));
  }
}
