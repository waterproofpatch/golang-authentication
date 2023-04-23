import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlantCareDialogData } from 'src/app/services/dialog.service';

@Component({
  selector: 'app-plant-care-dialog',
  templateUrl: './plant-care-dialog.component.html',
  styleUrls: ['./plant-care-dialog.component.css'],
})
export class PlantCareDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<PlantCareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlantCareDialogData
  ) { }

  ngOnInit(): void { }
  onOkClick(): void {
    this.dialogRef.close();
  }
}
