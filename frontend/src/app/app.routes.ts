import { Routes } from '@angular/router';
import LoginPage from './features/auth/login/login.component';
import { MainLayoutComponent } from './layout/main-layout.component';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'planning',
        data: {
          breadcrumb: 'Planning',
        },
        loadComponent: () =>
          import('./features/planning/planning.component').then((m) => m.PlanningComponent),
      },
      {
        path: 'employees',
        data: {
          breadcrumb: 'Employees',
        },
        loadComponent: () =>
          import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
      },
      {
        path: 'settings',
        data: {
          breadcrumb: 'Settings',
        },
        children: [
          {
            path: 'positions',
            data: {
              breadcrumb: 'Positions',
            },
            loadComponent: () =>
              import('./features/positions/positions.component').then((m) => m.PositionsComponent),
          },
          {
            path: 'zones',
            data: {
              breadcrumb: 'Zones',
            },
            loadComponent: () =>
              import('./features/zones/zones.component').then((m) => m.ZonesComponent),
          },
          {
            path: 'shifts',
            data: {
              breadcrumb: 'Shifts',
            },
            loadComponent: () =>
              import('./features/shifts/shifts.component').then((m) => m.ShiftsComponent),
          },
        ],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'planning',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
