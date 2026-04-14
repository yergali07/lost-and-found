import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface HealthResponse {
  status: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private http = inject(HttpClient);

  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>('http://127.0.0.1:8000/api/health/');
  }
}
