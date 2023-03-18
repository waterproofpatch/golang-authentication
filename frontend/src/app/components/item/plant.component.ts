import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DialogService } from 'src/app/services/dialog.service';
import Plant, { PlantsService } from 'src/app/services/plants.service';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.css']
})
export class PlantComponent {
  @Input() plant?: Plant
  isImageLoading: boolean = false
  imageUrl: string | null = null
  @Output() editModeEmitter = new EventEmitter<Plant>()
  backgroundColor: string = 'black'; // Set the default background color here

  constructor(private router: Router, private plantService: PlantsService, private dialogService: DialogService, private authenticationService: AuthenticationService) {

  }

  ngOnInit() {
    if (!this.authenticationService.isAuthenticated$.value) {
      this.router.navigateByUrl('/authentication?mode=login');
      return
    }
    this.getImage()
    if (new Date(this.getNextWaterDate()) < new Date()) {
      if (this.plant) {
        console.log("plant " + this.plant.id + " is due for watering!")
        this.backgroundColor = "red"
      }
    }
  }

  editPlant() {
    if (!this.plant) {
      return;
    }
    this.editModeEmitter.emit(this.plant)
  }
  waterPlant() {
    if (!this.plant) {
      return
    }
    var dialogRef = this.dialogService.displayConfirmationDialog("Did you water plant: " + this.plant.name + "?")
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        if (!this.plant) {
          return;
        }
        this.plant.lastWaterDate = new Date().toDateString()
        this.plantService.updatePlant(this.plant)
      } else {
        console.log("Dialog declined.")
      }
    })

  }

  transformLastWaterDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    const myDate = new Date(this.plant.lastWaterDate);
    return this.formatDate(myDate)
  }

  private formatDate(date: Date): string {

    const day = date.getDate().toString().padStart(2, '0'); // Get the day of the month (1-31) and pad it with a leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (0-11), add 1 to get the month as a number (1-12), and pad it with a leading zero if necessary
    const year = date.getFullYear().toString(); // Get the year (4 digits)

    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate
  }
  getNextWaterDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    var nextWaterDate = new Date()
    var lastWaterDate = new Date(this.plant.lastWaterDate)
    nextWaterDate.setDate(lastWaterDate.getDate() + parseInt(this.plant.wateringFrequency))
    return this.formatDate(nextWaterDate)
  }

  getImage() {
    if (!this.plant || this.plant.imageId == 0) {
      return
    }
    console.log("Getting image for imageId=" + this.plant.imageId)
    this.isImageLoading = true;
    this.plantService.getPlantImage(this.plant.imageId)
      .subscribe(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.imageUrl = reader.result as string;
        };
        reader.readAsDataURL(blob);
        this.isImageLoading = false;
      });
  }

  deletePlant() {
    if (!this.plant) {
      return;
    }
    var dialogRef = this.dialogService.displayConfirmationDialog("Are you sure you want to delete plant: " + this.plant.name + "?")
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        if (!this.plant) {
          return;
        }
        this.plantService.deletePlant(this.plant.id);
      } else {
        console.log("Dialog declined.")
      }
    })

  }
}
