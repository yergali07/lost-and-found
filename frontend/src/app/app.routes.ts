import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { ItemsComponent } from './pages/items/items';
import { ItemDetailComponent } from './pages/item-detail/item-detail';
import { ItemFormComponent } from './pages/item-form/item-form';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { mode: 'login' } },
  { path: 'register', component: LoginComponent, data: { mode: 'register' } },
  { path: 'items', component: ItemsComponent, canActivate: [authGuard] },
  { path: 'items/:id', component: ItemDetailComponent, canActivate: [authGuard] },
  { path: 'create-item', component: ItemFormComponent, canActivate: [authGuard] },
  { path: 'edit-item/:id', component: ItemFormComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  { path: '**', redirectTo: 'items' },
];
