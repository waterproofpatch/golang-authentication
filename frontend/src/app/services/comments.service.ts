import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, finalize } from 'rxjs';
import { CommentsApiService } from '../api/comments-api.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { Comment } from '../types';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  error$ = new Subject<string>();
  comments$ = new Subject<Comment[]>();

  public static CommentsFactory = class {
    public static printComment(comment: Comment): void {
      console.log("COMMENT:")
      console.log(`id: ${comment.id}`);
      console.log(`username: ${comment.username}`);
      console.log(`email: ${comment.email}`);
      console.log(`content: ${comment.content}`);
      console.log(`plantId: ${comment.plantId}`);
      console.log(`viewed: ${comment.viewed}`);
    }

    public static makeComment(content: string, plantId: number): Comment {
      const comment: Comment = {
        content: content,
        plantId: plantId,
        username: "", //authoritative
        email: "", //authoritative
        id: 0, //authoritative
        CreatedAt: "", // authoritative
        viewed: false, //authoritative
      }
      return comment;
    }
  }

  constructor(private commentsApiService: CommentsApiService) { }

  public viewComment(comment: Comment): void {
    // this check prevents us from recuring
    if (!comment.viewed) {
      console.log("viewing comment: " + comment.id)
      this.commentsApiService.put(comment).subscribe((x) => { })
    }
  }

  public deleteComment(id: number): Observable<any> {
    this.isLoading$.next(true);
    return this.commentsApiService.delete(id).pipe(
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
    delete comment.CreatedAt;
    return this.commentsApiService.post(comment).pipe(
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

}

