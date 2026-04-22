import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Item, ItemCreateRequest } from '../../models/item.model';

export interface ItemFilters {
  search?: string;
  item_type?: 'lost' | 'found' | '';
  category?: number | '';
  status?: 'active' | 'claimed' | 'resolved' | '';
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);

  getItems(filters?: ItemFilters): Observable<PaginatedResponse<Item>> {
    let params = new HttpParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      }
    }
    return this.http.get<PaginatedResponse<Item>>(`${environment.apiBaseUrl}/items/`, {
      params,
    });
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${environment.apiBaseUrl}/items/${id}/`);
  }

  createItem(data: ItemCreateRequest): Observable<Item> {
    return this.http.post<Item>(`${environment.apiBaseUrl}/items/`, this.toFormData(data));
  }

  updateItem(id: number, data: ItemCreateRequest): Observable<Item> {
    return this.http.put<Item>(`${environment.apiBaseUrl}/items/${id}/`, this.toFormData(data));
  }

  getMyItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${environment.apiBaseUrl}/items/me/`);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/items/${id}/`);
  }

  markResolved(id: number): Observable<Item> {
    return this.http.post<Item>(`${environment.apiBaseUrl}/items/${id}/mark-resolved/`, {});
  }

  private toFormData(data: ItemCreateRequest): FormData {
    const fd = new FormData();
    fd.append('title', data.title);
    fd.append('description', data.description);
    fd.append('item_type', data.item_type);
    fd.append('location', data.location);
    fd.append('date_lost_or_found', data.date_lost_or_found);
    if (data.category !== null) {
      fd.append('category', String(data.category));
    }
    if (data.image) {
      fd.append('image', data.image);
    }
    if (data.clearImage) {
      fd.append('clear_image', 'true');
    }
    return fd;
  }
}
