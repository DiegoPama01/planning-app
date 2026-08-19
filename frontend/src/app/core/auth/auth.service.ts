import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { CompanyMembership, LoginRequest, TokenResponse, User } from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  currentUser = signal<User | null>(null);
  activeCompany = signal<CompanyMembership | null>(null);

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
          this.currentUser.set(user);

          if (user.companies.length > 0) {
            this.activeCompany.set(user.companies[0]);
          }
        }),
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    this.currentUser.set(null);
    this.activeCompany.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}