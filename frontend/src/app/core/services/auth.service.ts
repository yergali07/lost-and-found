import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthTokens, LoginRequest, RegisterRequest, User } from '../../models/auth.model';

const API_URL = 'http://127.0.0.1:8000/api/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(data: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${API_URL}/login/`, data).pipe(
      tap((tokens) => this.storeTokens(tokens)),
    );
  }

  register(data: RegisterRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${API_URL}/register/`, data);
  }

  logout(): Observable<{ detail: string }> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http
      .post<{ detail: string }>(`${API_URL}/logout/`, { refresh })
      .pipe(tap(() => this.clearTokens()));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  refreshToken(): Observable<AuthTokens> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post<AuthTokens>(`${API_URL}/refresh/`, { refresh }).pipe(
      tap((tokens) => this.storeTokens(tokens)),
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${API_URL}/me/`);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
