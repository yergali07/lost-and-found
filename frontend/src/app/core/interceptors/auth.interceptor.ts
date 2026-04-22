import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const AUTH_PATH_FRAGMENTS = ['/auth/login/', '/auth/register/', '/auth/refresh/'];

const isAuthEndpoint = (req: HttpRequest<unknown>): boolean =>
  AUTH_PATH_FRAGMENTS.some((fragment) => req.url.includes(fragment));

const withBearer = (req: HttpRequest<unknown>, token: string): HttpRequest<unknown> =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  const request = token ? withBearer(req, token) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthEndpoint(req) || !authService.getRefreshToken()) {
        if (error.status === 401 && !isAuthEndpoint(req)) {
          authService.clearTokens();
          router.navigateByUrl('/login');
        }
        return throwError(() => error);
      }

      return authService.refreshToken().pipe(
        switchMap(() => {
          const fresh = authService.getAccessToken();
          if (!fresh) {
            authService.clearTokens();
            router.navigateByUrl('/login');
            return throwError(() => error);
          }
          return next(withBearer(req, fresh));
        }),
        catchError((refreshError) => {
          authService.clearTokens();
          router.navigateByUrl('/login');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
