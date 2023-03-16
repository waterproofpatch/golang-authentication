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

    this.plantsService.getPlants()
  }
  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
  }
  get name() { return this.form.get('name'); }
  get wateringFrequency() { return this.form.get('wateringFrequency'); }

  addPlant() {
    // Perform actions when the form is submitted
    console.log(this.form.value);
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '', this.form.controls.lastWateredDate.value || '')
    this.plantsService.addPlant(plant, this.selectedImage)
    this.addMode = false;
  }
  getPlants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}
