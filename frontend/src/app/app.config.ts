import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { API_BASE_URL } from './core/api/api.config';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: API_BASE_URL,
      useValue: 'http://127.0.0.1:8000/api',
    },
    provideAppInitializer(() => {
      inject(AuthService).hydrateContext();
    }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
      ]),
    ),
  ],
};
