export interface Claim {
  id: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;

  claimant: string;
  item: string;
}