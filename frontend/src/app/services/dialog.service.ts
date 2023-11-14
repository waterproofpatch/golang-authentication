import { Observable, of } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { BaseService } from './base.service';
import { LogDialogComponent } from 'src/app/components/log-dialog/log-dialog.component';
import { ErrorDialogComponent } from 'src/app/components/error-dialog/error-dialog.component';
import { ConfirmationDialogComponent } from '../components/confirmation-dialog/confirmation-dialog.component';
import { PlantCareDialogComponent } from '../components/plant-care-dialog/plant-care-dialog.component';
import { NotesComponent } from '../components/notes/notes.component';

export interface PlantNotesDialogData {
  notes: string,
}
export interface PlantCareDialogData {
  title: string,
  confirmationMsg: string,
  water: boolean,
  fertilize: boolean,
  skipFertilize: boolean,
  moist: boolean
}

@Injectable({
  providedIn: 'root',
})
export class DialogService extends BaseService {
  dialogRef: any = undefined;
  constructor(private dialog: MatDialog) {
    super();
  }

  displayNotesDialog(notes: string): any {
    const dialogRef = this.dialog.open(NotesComponent, {
      width: '300px',
      data: {
        notes: notes,
      }
    });
    return dialogRef
  }

  displayPlantCareDialog(plantName: string): any {
    const dialogRef = this.dialog.open(PlantCareDialogComponent, {
      width: '300px',
      data: {
        title: 'Confirm',
        confirmationMsg: "What did you do for " + plantName + "?",
        water: false,
        fertilize: false,
        skipFertilize: false,
        moist: false
      }
    });
    return dialogRef
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
}
