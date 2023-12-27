import { Injectable } from '@angular/core';
import { map, BehaviorSubject, Observable, finalize } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { Comment } from '../models/comment.model';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService extends BaseService {

  commentsApiUrl = '/api/comments';

  // list of comments
  comments$: BehaviorSubject<Comment[]> = new BehaviorSubject<Comment[]>([])

  constructor(private http: HttpClient) { super() }

  public getCommentsByPlantId(plantId: number): void {
    this.isLoading$.next(true);
    this.get(plantId).pipe(
      map((comments: any[]) => {
        return comments.sort((a: Comment, b: Comment) => b.id - a.id)
      }),
      finalize(() => {
        this.isLoading$.next(false)
      })
    ).subscribe((comments: Comment[]) => this.comments$.next(comments))
  }

  /**
   * delete a comment by id
   * @param id the id of the comment to delete
   */
  public deleteCommentById(id: number): void {
    this.isLoading$.next(true);
    this.delete(id).pipe(
      map((comments: any[]) => {
        return comments.sort((a: Comment, b: Comment) => b.id - a.id)
      }),
      finalize(() => {
        this.isLoading$.next(false);
      })
    ).subscribe((comments: Comment[]) => this.comments$.next(comments))
  }

  /**
   * create a new comment
   * @param comment the comment to post
   */
  public addComment(comment: Comment): void {
    this.isLoading$.next(true);
    this.post(comment).pipe(
      map((comments: any[]) => {
        return comments.sort((a: Comment, b: Comment) => b.id - a.id)
      }),
      finalize(() => {
        this.isLoading$.next(false);
      })
    ).subscribe((comments: Comment[]) => this.comments$.next(comments))
  }

  /**
   * get comments by plant id
   * @param plantId the plant to get comments for
   * @returns 
   */
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

