import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private sub = new Subscription();

  me = signal<User | null>(null);
  showNavbar = signal(true);

  ngOnInit(): void {
    this.updateForUrl(this.router.url);

    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => this.updateForUrl(e.urlAfterRedirects)),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  showLoginButton(): boolean {
    if (this.isLoggedIn()) return false;
    const url = this.router.url;
    return !(url.startsWith('/login') || url.startsWith('/register'));
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  private updateForUrl(url: string): void {
    const onAuthPages = url.startsWith('/login') || url.startsWith('/register');
    this.showNavbar.set(!onAuthPages);

    if (!this.authService.isLoggedIn()) {
      this.me.set(null);
      return;
    }

    this.authService.getMe().subscribe({
      next: (me) => this.me.set(me),
      error: () => this.me.set(null),
    });
  }
}