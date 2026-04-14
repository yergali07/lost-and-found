import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { ItemsComponent } from './pages/items/items';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { mode: 'login' } },
  { path: 'register', component: LoginComponent, data: { mode: 'register' } },
  { path: 'items', component: ItemsComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  { path: '**', redirectTo: 'items' },
];
