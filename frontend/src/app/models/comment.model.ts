export interface Comment {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  author: number;
  author_username: string;
  item: number;
}

export interface CommentCreateRequest {
  content: string;
}
