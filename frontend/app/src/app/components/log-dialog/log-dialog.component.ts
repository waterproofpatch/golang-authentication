import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface LogDialogData {
  logMsg: string;
}

@Component({
  selector: 'app-log-dialog',
  templateUrl: './log-dialog.component.html',
  styleUrls: ['./log-dialog.component.css'],
})
export class LogDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<LogDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LogDialogData
  ) { }

  ngOnInit(): void { }
  onOkClick(): void {
    this.dialogRef.close();
  }
}
