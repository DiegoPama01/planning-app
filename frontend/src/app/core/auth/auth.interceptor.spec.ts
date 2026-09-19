import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access_token', 'expired-access');
    localStorage.setItem('refresh_token', 'current-refresh');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('refreshes the access token and retries the original request', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/api/auth/me/'));

    const initialRequest = http.expectOne('/api/auth/me/');
    expect(initialRequest.request.headers.get('Authorization')).toBe('Bearer expired-access');
    initialRequest.flush({ detail: 'Token expired.' }, { status: 401, statusText: 'Unauthorized' });

    const refreshRequest = http.expectOne('/api/auth/oidc/refresh/');
    expect(refreshRequest.request.body).toEqual({ refresh_token: 'current-refresh' });
    refreshRequest.flush({ access: 'new-access', refresh: 'rotated-refresh' });

    const retryRequest = http.expectOne('/api/auth/me/');
    expect(retryRequest.request.headers.get('Authorization')).toBe('Bearer new-access');
    retryRequest.flush({ id: 1 });

    await expect(requestPromise).resolves.toEqual({ id: 1 });
    expect(localStorage.getItem('refresh_token')).toBe('rotated-refresh');
  });

  it('refreshes when auth/me returns forbidden for an expired token', async () => {
    const requestPromise = firstValueFrom(httpClient.get('/api/auth/me/'));

    const initialRequest = http.expectOne('/api/auth/me/');
    initialRequest.flush(
      { detail: 'Authentication credentials were not provided.' },
      { status: 403, statusText: 'Forbidden' },
    );

    const refreshRequest = http.expectOne('/api/auth/oidc/refresh/');
    refreshRequest.flush({ access: 'new-access' });

    const retryRequest = http.expectOne('/api/auth/me/');
    expect(retryRequest.request.headers.get('Authorization')).toBe('Bearer new-access');
    retryRequest.flush({ id: 1 });

    await expect(requestPromise).resolves.toEqual({ id: 1 });
  });
});
