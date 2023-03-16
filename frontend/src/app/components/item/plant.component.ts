import { Component, Input } from '@angular/core';
import Plant, { PlantsService } from 'src/app/services/plants.service';

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.css']
})
export class PlantComponent {
  constructor(private plantService: PlantsService) {

  }
  @Input() plant?: Plant
  imageUrl: string | null = null

  ngOnInit() {
    console.log("onInit")
    this.getImage()
  }

  waterPlant() {
    if (!this.plant) {
      return
    }
    this.plant.lastWaterDate = new Date().toDateString()
    this.plantService.updatePlant(this.plant)
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
    this.plantService.getPlantImage(this.plant.imageId)
      .subscribe(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.imageUrl = reader.result as string;
        };
        reader.readAsDataURL(blob);
      });
  }

  deletePlant() {
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    this.plantService.deletePlant(this.plant.id);

  }
}
