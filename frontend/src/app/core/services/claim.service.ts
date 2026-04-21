import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ClaimRequest {
  item: number;
  message: string;
}

export interface ClaimResponse {
  id: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  claimant: string;
  item: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private http = inject(HttpClient);

  submitClaim(itemId: number, message: string): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${API_URL}/claims/`, {
      item: itemId,
      message,
    });
  }
}