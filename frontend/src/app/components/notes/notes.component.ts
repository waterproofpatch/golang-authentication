import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlantNotesDialogData } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css'],
})
export class NotesComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<NotesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlantNotesDialogData
  ) { }

  ngOnInit(): void { }
  onOkClick(): void {
    this.dialogRef.close();
  }
}
