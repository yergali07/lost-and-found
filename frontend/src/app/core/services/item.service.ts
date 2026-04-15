import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Item, ItemCreateRequest } from '../../models/item.model';

const API_URL = 'http://127.0.0.1:8000/api';

export interface ItemFilters {
  search?: string;
  item_type?: string;
  category?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);

  getItems(filters?: ItemFilters): Observable<Item[]> {
    let params = new HttpParams();
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params = params.set(key, value);
        }
      }
    }
    return this.http.get<Item[]>(`${API_URL}/items/`, { params });
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${API_URL}/items/${id}/`);
  }

  createItem(data: ItemCreateRequest): Observable<Item> {
    return this.http.post<Item>(`${API_URL}/items/`, this.toFormData(data));
  }

  updateItem(id: number, data: ItemCreateRequest): Observable<Item> {
    return this.http.put<Item>(`${API_URL}/items/${id}/`, this.toFormData(data));
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/items/${id}/`);
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
    return fd;
  }
}
