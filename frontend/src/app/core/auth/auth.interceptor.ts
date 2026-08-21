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
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
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
  return url.includes('/auth/token/') || url.includes('/auth/me/');
}
