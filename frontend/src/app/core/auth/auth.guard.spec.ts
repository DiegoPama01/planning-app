import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guard';
import { User } from './auth.model';

describe('auth guards', () => {
  const loginTree = { route: 'login' } as unknown as UrlTree;
  const homeTree = { route: '/' } as unknown as UrlTree;
  const routeSnapshot = {} as ActivatedRouteSnapshot;
  const stateSnapshot = {} as RouterStateSnapshot;
  const user: User = {
    id: 1,
    username: 'user',
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    companies: [],
  };

  function configureAuthGuard(authService: Partial<AuthService>, createUrlTree: UrlTree) {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { createUrlTree: vi.fn(() => createUrlTree) } },
      ],
    });
  }

  it('redirects unauthenticated users to login', () => {
    configureAuthGuard({ isAuthenticated: () => false }, loginTree);

    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot, stateSnapshot));

    expect(result).toBe(loginTree);
  });

  it('allows authenticated users with a loaded context', () => {
    configureAuthGuard({
      isAuthenticated: () => true,
      currentUser: signal(user),
    }, loginTree);

    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot, stateSnapshot));

    expect(result).toBe(true);
  });

  it('loads the user before allowing an authenticated user without context', async () => {
    configureAuthGuard({
      isAuthenticated: () => true,
      currentUser: signal(null),
      loadCurrentUser: () => of(user),
    }, loginTree);

    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot, stateSnapshot));

    await expect(firstValueFrom(result as Observable<boolean | UrlTree>)).resolves.toEqual(true);
  });

  it('logs out and redirects when loading the current user fails', async () => {
    const logout = vi.fn();
    configureAuthGuard({
      isAuthenticated: () => true,
      currentUser: signal(null),
      loadCurrentUser: () => throwError(() => new Error('unauthorized')),
      logout,
    }, loginTree);

    const result = TestBed.runInInjectionContext(() => authGuard(routeSnapshot, stateSnapshot));

    await expect(firstValueFrom(result as Observable<boolean | UrlTree>)).resolves.toBe(loginTree);
    expect(logout).toHaveBeenCalledOnce();
  });

  it('allows unauthenticated users through the guest guard', () => {
    configureAuthGuard({ isAuthenticated: () => false }, homeTree);

    const result = TestBed.runInInjectionContext(() => guestGuard(routeSnapshot, stateSnapshot));

    expect(result).toBe(true);
  });

  it('redirects authenticated users away from guest pages', () => {
    configureAuthGuard({
      isAuthenticated: () => true,
      currentUser: signal(user),
    }, homeTree);

    const result = TestBed.runInInjectionContext(() => guestGuard(routeSnapshot, stateSnapshot));

    expect(result).toBe(homeTree);
  });

  it('redirects to home after the guest guard loads the current user', async () => {
    configureAuthGuard({
      isAuthenticated: () => true,
      currentUser: signal(null),
      loadCurrentUser: () => of(user),
    }, homeTree);

    const result = TestBed.runInInjectionContext(() => guestGuard(routeSnapshot, stateSnapshot));

    await expect(firstValueFrom(result as Observable<boolean | UrlTree>)).resolves.toBe(homeTree);
  });

  it('allows access to the guest page when loading the user fails', async () => {
    const logout = vi.fn();
    configureAuthGuard({
      isAuthenticated: () => true,
      currentUser: signal(null),
      loadCurrentUser: () => throwError(() => new Error('unauthorized')),
      logout,
    }, homeTree);

    const result = TestBed.runInInjectionContext(() => guestGuard(routeSnapshot, stateSnapshot));

    await expect(firstValueFrom(result as Observable<boolean | UrlTree>)).resolves.toBe(true);
    expect(logout).toHaveBeenCalledOnce();
  });
});
