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
  updated_at: string;
  claimant: number;
  claimant_username: string;
  item: number;
  item_title: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private http = inject(HttpClient);

  submitClaim(itemId: number, message: string): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${API_URL}/claims/`, {
      item: itemId,
      message,
    } satisfies ClaimRequest);
  }

  /**
   * My claims endpoint in your backend is /api/claims/me/
   * (If you added aliases /api/my/claims/, you can swap it.)
   */
  getMyClaims(): Observable<ClaimResponse[]> {
    return this.http.get<ClaimResponse[]>(`${API_URL}/claims/me/`);
  }

  getMyItemClaims(): Observable<ClaimResponse[]> {
    return this.http.get<ClaimResponse[]>(`${API_URL}/claims/items/`);
  }

  approveClaim(claimId: number): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${API_URL}/claims/${claimId}/approve/`, {});
  }

  rejectClaim(claimId: number): Observable<ClaimResponse> {
    return this.http.post<ClaimResponse>(`${API_URL}/claims/${claimId}/reject/`, {});
  }
}