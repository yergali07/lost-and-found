import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ItemsComponent } from './pages/items/items';
import { MyItemsComponent } from './pages/my-items/my-items';
import { ItemDetailComponent } from './pages/item-detail/item-detail';
import { ItemFormComponent } from './pages/item-form/item-form';
import { MyClaimsComponent } from './pages/my-claims/my-claims';
import { ProfileComponent } from './pages/profile/profile';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'items', component: ItemsComponent, canActivate: [authGuard] },
  { path: 'my-items', component: MyItemsComponent, canActivate: [authGuard] },
  { path: 'my-claims', component: MyClaimsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'items/:id', component: ItemDetailComponent, canActivate: [authGuard] },
  { path: 'create-item', component: ItemFormComponent, canActivate: [authGuard] },
  { path: 'edit-item/:id', component: ItemFormComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'items' },
  { path: '**', redirectTo: 'items' },
];
