import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import {
  CompanyMembership,
  LoginRequest,
  TokenRefreshResponse,
  TokenResponse,
  User,
} from './auth.model';
import { AuthContextService } from './auth-context.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly authContext = inject(AuthContextService);
  private refreshRequest$: Observable<string> | null = null;

  currentUser = this.authContext.currentUser;
  activeCompany = this.authContext.activeCompany;

  login(credentials: LoginRequest) {
    return this.http
      .post<TokenResponse>(`${this.apiUrl}/auth/token/`, credentials)
      .pipe(
        tap((tokens) => {
          localStorage.setItem('access_token', tokens.access);
          localStorage.setItem('refresh_token', tokens.refresh);
        }),
      );
  }

  loadCurrentUser() {
    return this.http
      .get<User>(`${this.apiUrl}/auth/me/`)
      .pipe(
        tap((user) => {
          const activeCompany = this.resolveActiveCompany(user, this.activeCompany());
          this.authContext.setSession(user, activeCompany);
        }),
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.refreshRequest$ = null;
    this.authContext.clear();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  hydrateContext(): void {
    this.authContext.hydrate();
  }

  setActiveCompany(company: CompanyMembership | null): void {
    this.authContext.setActiveCompany(company);
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Missing refresh token.'));
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http
      .post<TokenRefreshResponse>(`${this.apiUrl}/auth/token/refresh/`, {
        refresh: refreshToken,
      })
      .pipe(
        map((response) => response.access),
        tap((accessToken) => {
          localStorage.setItem('access_token', accessToken);
        }),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshRequest$;
  }

  private resolveActiveCompany(
    user: User,
    currentCompany: CompanyMembership | null,
  ): CompanyMembership | null {
    if (!currentCompany) {
      return user.companies[0] ?? null;
    }

    return (
      user.companies.find((company) => company.id === currentCompany.id) ??
      user.companies[0] ??
      null
    );
  }
}
