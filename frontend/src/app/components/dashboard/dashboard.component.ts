import { Component } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';
import { PlantsService } from 'src/app/services/plants.service';
import Plant from 'src/app/services/plants.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  selectedImage: File | null = null;
  form = new FormGroup({
    nameOfPlant: new FormControl('', Validators.required),
    wateringFrequency: new FormControl(0, [Validators.required, Validators.min(0)])
  });

  constructor(
    private plantsService: PlantsService,
    private formBuilder: FormBuilder,
  ) {
    this.form = this.formBuilder.group({
      nameOfPlant: ['Plant Name'],
      wateringFrequency: [5]
    });
  }

  ngOnInit(): void {
    this.plantsService.getPlants()
  }
  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }

  addPlant() {
    // Perform actions when the form is submitted
    console.log(this.form.value);
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.nameOfPlant.value || '', this.form.controls.wateringFrequency.value || 0)
    this.plantsService.addPlant(plant, this.selectedImage)
  }
  getPlants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}
