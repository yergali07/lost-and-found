export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface ClaimRequest {
  item: number;
  message: string;
}

export interface Claim {
  id: number;
  message: string;
  status: ClaimStatus;
  created_at: string;
  updated_at: string;
  claimant: number;
  claimant_username: string;
  item: number;
  item_title: string;
}
