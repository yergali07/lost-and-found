export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  item_type: 'lost' | 'found';
  status: 'active' | 'claimed' | 'resolved';
  location: string;
  date_lost_or_found: string;
  image: string | null;
  category: number;
  category_name: string;
  owner: number;
  owner_username: string;
  created_at: string;
  updated_at: string;
}

export interface ItemCreateRequest {
  title: string;
  description: string;
  item_type: 'lost' | 'found';
  location: string;
  date_lost_or_found: string;
  category: number | null;
  image?: File | null;
  clearImage?: boolean;
}
