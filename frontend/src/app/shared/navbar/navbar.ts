import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
  loggedIn = signal(false);
  showNavbar = signal(true);
  currentUrl = signal(this.router.url);

  showLoginButton = computed(() => {
    if (this.loggedIn()) return false;
    const url = this.currentUrl();
    return !(url.startsWith('/login') || url.startsWith('/register'));
  });

  ngOnInit(): void {
    this.refreshAuthState();
    this.updateChromeForUrl(this.router.url);

    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => {
          this.updateChromeForUrl(e.urlAfterRedirects);
          this.refreshAuthState();
        }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.me.set(null);
        this.loggedIn.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.me.set(null);
        this.loggedIn.set(false);
        this.router.navigate(['/login']);
      },
    });
  }

  private updateChromeForUrl(url: string): void {
    const onAuthPages = url.startsWith('/login') || url.startsWith('/register');
    this.showNavbar.set(!onAuthPages);
    this.currentUrl.set(url);
  }

  private refreshAuthState(): void {
    const isLoggedIn = this.authService.isLoggedIn();
    this.loggedIn.set(isLoggedIn);

    if (!isLoggedIn) {
      this.me.set(null);
      return;
    }

    if (this.me() !== null) {
      return;
    }

    this.authService.getMe().subscribe({
      next: (me) => this.me.set(me),
      error: () => this.me.set(null),
    });
  }
}
