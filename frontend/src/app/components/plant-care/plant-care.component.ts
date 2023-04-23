import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PlantCareDialogData {
  confirmationMsg: string;
  water: boolean;
  fertilize: boolean;
}

@Component({
  selector: 'app-plant-care',
  templateUrl: './plant-care.component.html',
  styleUrls: ['./plant-care.component.css'],
})
export class PlantCareComponent implements OnInit {
  water: boolean = false
  fertilize: boolean = false

  constructor(
    public dialogRef: MatDialogRef<PlantCareComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PlantCareDialogData
  ) { }

  ngOnInit(): void { }
  onOkClick(): void {
    this.dialogRef.close();
  }
}
