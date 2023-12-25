import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, finalize } from 'rxjs';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';

import { Comment } from '../models/comment.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService extends BaseService {

  commentsApiUrl = '/api/comments';
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  comments$ = new Subject<Comment[]>();

  constructor(private http: HttpClient) { super() }

  public viewComment(comment: Comment): void {
    // this check prevents us from recuring
    if (!comment.viewed) {
      console.log("viewing comment: " + comment.id)
      this.put(comment).subscribe((x) => { })
    }
  }

  /**
   * delete a comment by id
   * @param id the id of the comment to delete
   * @returns an observable
   */
  public deleteCommentById(id: number): Observable<any> {
    this.isLoading$.next(true);
    return this.delete(id).pipe(
      finalize(() => {
        this.isLoading$.next(false);
      })
    );
  }

  /**
   * create a new comment
   * @param comment the comment to post
   * @returns an observable
   */
  public postComment(comment: Comment): Observable<any> {
    this.isLoading$.next(true);
    // delete comment.CreatedAt;
    return this.post(comment).pipe(
      finalize(() => {
        this.isLoading$.next(false);
      })
    );
  }

  /**
   * create a new comment on the server
   * @param comment comment to post
   * @returns an observable
   */
  post(comment: Comment): Observable<any> {
    return this.http.post(this.getUrlBase() + this.commentsApiUrl + "/" + comment.id, comment, this.httpOptions);
  }
  // updating the comment marks it as viewed on the remote side
  put(comment: Comment): Observable<any> {
    return this.http.put(this.getUrlBase() + this.commentsApiUrl + "/" + comment.id, comment, this.httpOptions);
  }

  delete(
    id: number,
  ): Observable<any> {
    return this.http.delete(
      this.getUrlBase() + this.commentsApiUrl + "/" + id,
      this.httpOptions);
  }
}

