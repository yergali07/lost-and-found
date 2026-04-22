import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, finalize, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthTokens,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from '../../models/auth.model';

const AUTH_URL = `${environment.apiBaseUrl}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  login(data: LoginRequest): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${AUTH_URL}/login/`, data)
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  register(data: RegisterRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${AUTH_URL}/register/`, data);
  }

  logout(): Observable<{ detail: string } | null> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      this.clearTokens();
      return of(null);
    }
    return this.http
      .post<{ detail: string }>(`${AUTH_URL}/logout/`, { refresh })
      .pipe(finalize(() => this.clearTokens()));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  refreshToken(): Observable<AuthTokens> {
    const refresh = this.getRefreshToken();
    return this.http
      .post<AuthTokens>(`${AUTH_URL}/refresh/`, { refresh })
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${AUTH_URL}/me/`);
  }

  changePassword(data: ChangePasswordRequest): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${AUTH_URL}/change-password/`, data);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
