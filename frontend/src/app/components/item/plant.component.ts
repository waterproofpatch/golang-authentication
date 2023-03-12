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
  editMode: boolean = false
  imageUrl: string | null = null

  editPlant() {
    this.editMode = true;
    return;
  }

  ngOnInit() {
    console.log("onInit")
    this.getImage()
  }

  getImage() {
    if (!this.plant) {
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

  leaveEditMode() {
    this.editMode = false;
  }
  save() {
    if (this.plant) {
      console.log("Sending plant name " + this.plant.name)
      this.plantService.updatePlant(this.plant)
    }
    this.leaveEditMode();
  }

  cancel() {
    this.leaveEditMode();
  }

  deletePlant() {
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    this.plantService.deletePlant(this.plant.id);

  }
}
