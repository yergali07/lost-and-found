import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Claim, ClaimRequest } from '../../models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {
  private http = inject(HttpClient);

  submitClaim(itemId: number, message: string): Observable<Claim> {
    return this.http.post<Claim>(`${environment.apiBaseUrl}/claims/`, {
      item: itemId,
      message,
    } satisfies ClaimRequest);
  }

  getMyClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${environment.apiBaseUrl}/claims/me/`);
  }

  getMyItemClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${environment.apiBaseUrl}/claims/items/`);
  }

  approveClaim(claimId: number): Observable<Claim> {
    return this.http.post<Claim>(`${environment.apiBaseUrl}/claims/${claimId}/approve/`, {});
  }

  rejectClaim(claimId: number): Observable<Claim> {
    return this.http.post<Claim>(`${environment.apiBaseUrl}/claims/${claimId}/reject/`, {});
  }
}
