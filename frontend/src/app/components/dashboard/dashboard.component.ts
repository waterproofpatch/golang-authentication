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
    name: new FormControl('', Validators.required),
    wateringFrequency: new FormControl('', [Validators.required])
  });

  constructor(
    private plantsService: PlantsService,
    private formBuilder: FormBuilder,
  ) {
    this.form = this.formBuilder.group({
      name: [''],
      wateringFrequency: ['']
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
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '')
    this.plantsService.addPlant(plant, this.selectedImage)
  }
  getPlants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}
