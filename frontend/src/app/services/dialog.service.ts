import { Observable, of } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { BaseService } from './base.service';
import { LogDialogComponent } from 'src/app/components/log-dialog/log-dialog.component';
import { ErrorDialogComponent } from 'src/app/components/error-dialog/error-dialog.component';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';

export interface NewGameDialogData { }

@Injectable({
  providedIn: 'root',
})
export class DialogService extends BaseService {
  dialogRef: any = undefined;
  constructor(private dialog: MatDialog) {
    super();
  }

  displayConfirmationDialog(confirmationMsg: string): any {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '300px',
      data: { title: 'Confirm', confirmationMsg: confirmationMsg }
    });
    return dialogRef
  }
  /**
   * display an error modal.
   * @param errorMsg the error message to display.
   */
  displayErrorDialog(errorMsg: string): void {
    this.dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '250px',
      data: { errorMsg: errorMsg },
    });

    this.dialogRef.afterClosed().pipe(takeUntil(this.destroy$)),
      finalize(() => (this.dialogRef = undefined));
  }

  /**
   * display a generic log message as a modal.
   * @param logMsg the message to display
   */
  displayLogDialog(logMsg: string): void {
    this.dialogRef = this.dialog.open(LogDialogComponent, {
      width: '250px',
      data: { logMsg: logMsg },
    });

    this.dialogRef.afterClosed().pipe(takeUntil(this.destroy$)),
      finalize(() => (this.dialogRef = undefined));
  }
  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      if (error.error == null) {
        this.displayErrorDialog('Unknown error - failed: ' + operation);
      } else {
        this.displayErrorDialog(
          `${operation} failed: ${error.error.error_message}`
        );
      }

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
