import { Component } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { PlantsService } from 'src/app/services/plants.service';
import Plant from 'src/app/services/plants.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.css']
})
export class PlantsComponent {

  suggestedWateringFrequency: BehaviorSubject<number> = new BehaviorSubject<number>(0)
  selectedImage: File | null = null;
  isWaitingSuggestedWateringFrequency: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  selectedImagePreview_safe: SafeUrl | null = null;
  selectedImagePreview: string = "/assets/placeholder.jpg"
  isLoading: boolean = false;
  addMode: boolean = false
  editingPlant: Plant | null = null
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.min(3), Validators.max(30)]),
    wateringFrequency: new FormControl('', [Validators.required]),
    lastWateredDate: new FormControl('', [Validators.required])
  });

  constructor(
    private sanitizer: DomSanitizer,
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
    this.plantsService.suggestedWateringFrequency.subscribe((x) => {
      console.log("Updated watering frequency: " + x)
      this.suggestedWateringFrequency.next(x)
      this.isWaitingSuggestedWateringFrequency.next(false)
    })
    this.plantsService.isLoading.subscribe((x) => { if (x) { this.isLoading = true } else { this.isLoading = false } })
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);

    this.getPlants()
  }

  getSuggestedWateringFrequency() {
    let plantName = this.form.controls.name.value
    if (plantName) {
      this.isWaitingSuggestedWateringFrequency.next(true)
      this.plantsService.getPlantWateringFrequency(plantName)
    }
  }
  editPlant(event: any) {
    let plant = event.plant
    let imageUrl = event.imageUrl
    console.log("Plant ID " + plant.id + " wants edit. It has current image at " + imageUrl)
    this.editingPlant = plant
    this.form.controls.name.setValue(plant.name)
    this.form.controls.wateringFrequency.setValue(plant.wateringFrequency)
    this.form.controls.lastWateredDate.setValue(plant.lastWaterDate)
    if (imageUrl) {

      this.selectedImagePreview = imageUrl
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
    this.addMode = true
  }

  cancelAddMode() {
    this.addMode = false;
    this.selectedImagePreview = "/assets/placeholder.jpg"
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    this.getPlants()
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
    if (this.selectedImage) {
      this.selectedImagePreview = URL.createObjectURL(this.selectedImage)
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
  }
  get name() { return this.form.get('name'); }
  get wateringFrequency() { return this.form.get('wateringFrequency'); }

  addPlant() {
    if (this.editingPlant) {
      console.log("A plant has been edited (not added)")
      var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '', this.form.controls.lastWateredDate.value || '')
      plant.id = this.editingPlant.id
      this.plantsService.updatePlant(plant, this.selectedImage)
      this.editingPlant = null
      this.addMode = false;
      this.selectedImage = null
      this.selectedImagePreview = "/assets/placeholder.jpg"
      this.selectedImagePreview_safe = null
      return
    }
    // Perform actions when the form is submitted
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '', this.form.controls.wateringFrequency.value || '', this.form.controls.lastWateredDate.value || '')
    this.plantsService.addPlant(plant, this.selectedImage)
    this.addMode = false;
    this.selectedImage = null
    this.selectedImagePreview = "/assets/placeholder.jpg"
    this.selectedImagePreview_safe = null
  }
  getPlants(): void {
    this.plantsService.getPlants()
  }

  get plants(): Subject<Plant[]> {
    return this.plantsService.plants
  }
}
