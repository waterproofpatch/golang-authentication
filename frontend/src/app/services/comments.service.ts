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
  error$ = new Subject<string>();
  comments$ = new Subject<Comment[]>();

  public static CommentsFactory = class {

    public static makeComment(content: string, plantId: number): Comment {
      const comment: Comment = {
        content: content,
        plantId: plantId,
        username: "", // authoritative
        email: "", // authoritative
        id: 0, // authoritative
        createdAt: new Date(), // authoritative
        viewed: false, // authoritative
      }
      return comment;
    }
  }

  constructor(private http: HttpClient) { super() }

  public viewComment(comment: Comment): void {
    // this check prevents us from recuring
    if (!comment.viewed) {
      console.log("viewing comment: " + comment.id)
      this.put(comment).subscribe((x) => { })
    }
  }

  public deleteComment(id: number): Observable<any> {
    this.isLoading$.next(true);
    return this.delete(id).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          this.error$.next(error.error.error_message);
        } else {
          this.error$.next('Unexpected error');
        }
        return throwError(error);
      }),
      finalize(() => {
        this.isLoading$.next(false);
      })
    );
  }

  public postComment(comment: Comment): Observable<any> {
    this.isLoading$.next(true);
    // delete comment.CreatedAt;
    return this.post(comment).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          this.error$.next(error.error.error_message);
        } else {
          this.error$.next('Unexpected error');
        }
        return throwError(error);
      }),
      finalize(() => {
        this.isLoading$.next(false);
      })
    );
  }

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

