import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Claim } from '../../models/claim.model';

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private http = inject(HttpClient);

  submitClaim(itemId: number, message: string): Observable<Claim> {
    return this.http.post<Claim>(`${API_URL}/claims/`, {
      item: itemId,
      message,
    });
  }

  getMyClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${API_URL}/claims/me/`);
  }

  getMyItemClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${API_URL}/claims/items/`);
  }

  approveClaim(id: number): Observable<Claim> {
    return this.http.post<Claim>(`${API_URL}/claims/${id}/approve/`, {});
  }

  rejectClaim(id: number): Observable<Claim> {
    return this.http.post<Claim>(`${API_URL}/claims/${id}/reject/`, {});
  }
}