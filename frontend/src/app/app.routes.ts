import { Routes } from '@angular/router';
import LoginPage from './features/auth/login/login.component';



export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];