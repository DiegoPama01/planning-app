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
        loadComponent: () =>
          import('./features/planning/planning.component').then((m) => m.PlanningComponent),
      },
      {
        path: 'employees',
        loadComponent: () =>
          import('./features/employees/employees.component').then((m) => m.EmployeesComponent),
      },
      {
        path: 'settings/positions',
        loadComponent: () =>
          import('./features/positions/positions.component').then((m) => m.PositionsComponent),
      },
      {
        path: 'settings/zones',
        loadComponent: () =>
          import('./features/zones/zones.component').then((m) => m.ZonesComponent),
      },
      {
        path: 'settings/shifts',
        loadComponent: () =>
          import('./features/shifts/shifts.component').then((m) => m.ShiftsComponent),
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
