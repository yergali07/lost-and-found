import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HealthService } from './core/services/health.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  protected readonly healthStatus = signal<string | null>(null);
  protected readonly healthError = signal<string | null>(null);

  private healthService = inject(HealthService);

  ngOnInit(): void {
    this.healthService.checkHealth().subscribe({
      next: (res) => this.healthStatus.set(res.status),
      error: (err) => this.healthError.set(err.message),
    });
  }
}
