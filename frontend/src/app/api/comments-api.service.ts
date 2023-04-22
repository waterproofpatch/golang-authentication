import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BaseService } from '../services/base.service';
import Comment from '../services/comments.service';

@Injectable({
  providedIn: 'root',
})
export class CommentsApiService extends BaseService {
  commentsApiUrl = '/api/comments';
  constructor(private http: HttpClient) {
    super();
  }
  post(comment: Comment): Observable<any> {
    return this.http.post(this.getUrlBase() + this.commentsApiUrl + "/" + comment.plantId, comment, this.httpOptions);
  }
  // updating the comment marks it as viewed on the remote side
  put(comment: Comment): Observable<any> {
    return this.http.put(this.getUrlBase() + this.commentsApiUrl + "/" + comment.plantId + "?commentId=" + comment.id, comment, this.httpOptions);
  }
  get(
    plantId: number,
  ): Observable<any> {
    if (plantId) {
      return this.http.get(
        this.getUrlBase() + this.commentsApiUrl + "/" + plantId,
        this.httpOptions
      );
    } else {
      return this.http.get(
        this.getUrlBase() + this.commentsApiUrl,
        this.httpOptions
      );
    }
  }
  delete(
    comment: Comment,
  ): Observable<any> {
    return this.http.delete(
      this.getUrlBase() + this.commentsApiUrl + "/" + comment.plantId + "?commentId=" + comment.id,
      this.httpOptions);
  }
}
