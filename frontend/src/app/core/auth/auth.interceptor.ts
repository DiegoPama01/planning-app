import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  if (isAuthRequest(req.url)) {
    return next(req);
  }

  if (!accessToken) {
    return next(req);
  }

  return next(addAuthorizationHeader(req, accessToken)).pipe(
    catchError((error: unknown) => {
      if (!shouldRefreshToken(error, req.url)) {
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((refreshedAccessToken) => next(addAuthorizationHeader(req, refreshedAccessToken))),
        catchError((refreshError) => throwError(() => refreshError)),
      );
    }),
  );
};

function addAuthorizationHeader(req: Parameters<HttpInterceptorFn>[0], accessToken: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function isAuthRequest(url: string): boolean {
  return url.includes('/auth/token/') || url.includes('/auth/oidc/');
}

function shouldRefreshToken(error: unknown, url: string): error is HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  return error.status === 401 || (error.status === 403 && url.endsWith('/auth/me/'));
}
