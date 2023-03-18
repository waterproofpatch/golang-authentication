import { Component } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';
import { PlantsService } from 'src/app/services/plants.service';
import Plant from 'src/app/services/plants.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  selectedImage: File | null = null;
  isLoading: boolean = false;
  addMode: boolean = false
  editingPlant: Plant | null = null
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.min(3), Validators.max(30)]),
    wateringFrequency: new FormControl('', [Validators.required]),
    lastWateredDate: new FormControl('', [Validators.required])
  });

  constructor(
    private plantsService: PlantsService,
    private formBuilder: FormBuilder,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
    this.form = this.formBuilder.group({
      name: [''],
      wateringFrequency: [''],
      lastWateredDate: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authenticationService.isAuthenticated$.value) {
      this.router.navigateByUrl('/authentication?mode=login');
      return
    }
    this.authenticationService.isAuthenticated$.subscribe((x) => {
      if (!x) {
        this.router.navigateByUrl('/authentication?mode=login');
        setTimeout(() => this.router.navigateByUrl('/authentication?mode=login'), 0)
      }
    })
    this.plantsService.isLoading.subscribe((x) => { if (x) { this.isLoading = true } else { this.isLoading = false } })

    this.getPlants()
  }

  editPlant(plant: Plant) {
    console.log("Plant ID " + plant.id + " wants edit")
    this.editingPlant = plant
    this.form.controls.name.setValue(plant.name)
    this.form.controls.wateringFrequency.setValue(plant.wateringFrequency)
    this.form.controls.lastWateredDate.setValue(plant.lastWaterDate)
    this.addMode = true
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }
  get name() { return this.form.get('name'); }
  get wateringFrequency() { return this.form.get('wateringFrequency'); }

  addPlant() {
    if (this.editingPlant) {
      console.log("A plant has been edited (not added)")
    }
    // Perform actions when the form is submitted
    console.log(this.form.value);
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '', this.form.controls.lastWateredDate.value || '')
    this.plantsService.addPlant(plant, this.selectedImage)
    this.addMode = false;
  }
  getPlants(): void {
    this.plantsService.getPlants()
  }

  get plants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}
