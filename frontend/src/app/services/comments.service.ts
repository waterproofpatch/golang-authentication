import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommentsApiService } from '../api/comments-api.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export default interface Comment {
  id: number;
  CreatedAt?: string;
  plantId: number;
  content: string;
  username: string;
  email: string;
  viewed: boolean;
}
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
      console.log("viewed comment: " + comment.id)
      comment.viewed = true
      this.commentsApiService.put(comment).subscribe((x) => { this.updateCommentsList(x) })
    }
  }

  public deleteComment(comment: Comment): void {
    this.isLoading$.next(true)
    this.commentsApiService
      .delete(comment)
      .pipe(
        catchError((error: any) => {
          this.isLoading$.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(error);
        })
      )
      .subscribe((x) => {
        this.updateCommentsList(x)
      });
  }
  public postComment(comment: Comment): void {
    this.isLoading$.next(true)
    delete comment.CreatedAt;
    this.commentsApiService
      .post(comment)
      .pipe(
        catchError((error: any) => {
          this.isLoading$.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(error);
        })
      )
      .subscribe((x) => {
        this.updateCommentsList(x)
      });
  }
  public getComments(plantId: number): void {
    this.isLoading$.next(true)
    this.commentsApiService
      .get(plantId)
      .pipe(
        catchError((error: any) => {
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(error);
        })
      )
      .subscribe((x) => {
        this.updateCommentsList(x)
      });
  }

  private updateCommentsList(comments: Comment[]): void {
    comments = comments.sort((a: any, b: any) => b.id - a.id)
    this.comments$.next(comments)
    this.isLoading$.next(false)
  }
}

