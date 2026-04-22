import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Comment, CommentCreateRequest } from '../../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private http = inject(HttpClient);

  listComments(itemId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      `${environment.apiBaseUrl}/items/${itemId}/comments/`,
    );
  }

  createComment(itemId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(
      `${environment.apiBaseUrl}/items/${itemId}/comments/`,
      { content } satisfies CommentCreateRequest,
    );
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/comments/${commentId}/`);
  }
}
