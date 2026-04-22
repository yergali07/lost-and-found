import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClaimService } from '../../core/services/claim.service';
import { Claim } from '../../models/claim.model';

@Component({
  selector: 'app-my-claims',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './my-claims.html',
  styleUrl: './my-claims.css',
})
export class MyClaimsComponent implements OnInit {
  private claimService = inject(ClaimService);

  claims = signal<Claim[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.claimService.getMyClaims().subscribe({
      next: (claims) => {
        this.claims.set(claims);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Failed to load claims.');
        this.loading.set(false);
      },
    });
  }
}
