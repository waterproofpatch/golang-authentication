import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommentsApiService } from '../api/comments-api.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export default interface Comment {
  id: number;
  plantId: number;
  content: string;
  username: string;
  email: string;
}
@Injectable({
  providedIn: 'root'
})
export class CommentsService {

  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  error$ = new Subject<string>();
  comments$ = new Subject<Comment[]>();
  constructor(private commentsApiService: CommentsApiService) { }

  public getComments(plantId: number): void {
    this.isLoading.next(true)
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

  private updateCommentsList(comments: Comment[]) {
    this.comments$.next(comments)
  }
}

