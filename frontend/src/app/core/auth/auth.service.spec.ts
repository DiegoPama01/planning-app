import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService refresh', () => {
  let authService: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    authService = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores a rotated refresh token', () => {
    localStorage.setItem('refresh_token', 'old-refresh');

    let refreshedAccessToken: string | undefined;
    authService.refreshAccessToken().subscribe((accessToken) => {
      refreshedAccessToken = accessToken;
    });

    const request = http.expectOne('/api/auth/oidc/refresh/');
    expect(request.request.body).toEqual({ refresh_token: 'old-refresh' });
    request.flush({
      access: 'new-access',
      refresh: 'new-refresh',
      expires_in: 300,
      token_type: 'Bearer',
    });

    expect(refreshedAccessToken).toBe('new-access');
    expect(localStorage.getItem('access_token')).toBe('new-access');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
  });

  it('keeps the current refresh token when Authentik does not rotate it', () => {
    localStorage.setItem('refresh_token', 'current-refresh');

    authService.refreshAccessToken().subscribe();
    const request = http.expectOne('/api/auth/oidc/refresh/');
    request.flush({ access: 'new-access' });

    expect(localStorage.getItem('refresh_token')).toBe('current-refresh');
  });

  it('shares one refresh request between concurrent callers', () => {
    localStorage.setItem('refresh_token', 'current-refresh');
    const receivedTokens: string[] = [];

    authService.refreshAccessToken().subscribe((token) => receivedTokens.push(token));
    authService.refreshAccessToken().subscribe((token) => receivedTokens.push(token));

    const requests = http.match('/api/auth/oidc/refresh/');
    expect(requests).toHaveLength(1);
    requests[0].flush({ access: 'new-access', refresh: 'new-refresh' });

    expect(receivedTokens).toEqual(['new-access', 'new-access']);
  });

  it('clears the session when the refresh token is rejected', () => {
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('refresh_token', 'invalid-refresh');

    let refreshError: unknown;
    authService.refreshAccessToken().subscribe({
      error: (error) => {
        refreshError = error;
      },
    });

    const request = http.expectOne('/api/auth/oidc/refresh/');
    request.flush({ refresh_token: ['Invalid or expired refresh token.'] }, { status: 400, statusText: 'Bad Request' });

    expect(refreshError).toBeTruthy();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
