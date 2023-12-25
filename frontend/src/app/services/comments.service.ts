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

  constructor(private http: HttpClient) { super() }

  public getCommentsByPlantId(plantId: number): Observable<any> {
    this.isLoading$.next(true);
    return this.get(plantId).pipe(
      finalize(() => {
        this.isLoading$.next(false)
      })
    )
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
    return this.post(comment).pipe(
      finalize(() => {
        this.isLoading$.next(false);
      })
    );
  }

  private get(plantId: number): Observable<any> {
    return this.http.get(this.getUrlBase() + this.commentsApiUrl + "?plantId=" + plantId, this.httpOptions)
  }

  /**
   * create a new comment on the server
   * @param comment comment to post
   * @returns an observable
   */
  private post(comment: Comment): Observable<any> {
    return this.http.post(this.getUrlBase() + this.commentsApiUrl + "/" + comment.id, comment, this.httpOptions);
  }

  /**
   * remove a comment from the server
   * @param id the ID of the comment to delete
   * @returns an observable
   */
  private delete(
    id: number,
  ): Observable<any> {
    return this.http.delete(
      this.getUrlBase() + this.commentsApiUrl + "/" + id,
      this.httpOptions);
  }
}

