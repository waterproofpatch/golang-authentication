import { Component } from '@angular/core';
import { PlantsService } from 'src/app/services/plants.service';
import Plant from 'src/app/services/plants.service';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export enum EditMode {
  ADD = 1,
  EDIT = 2,
  NEITHER = 3,
}

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.css']
})
export class PlantsComponent {
  public wateringFrequencyOptions = Array.from({ length: 60 }, (_, i) => i + 1);
  public fertilizingFrequencyOptions = Array.from({ length: 60 }, (_, i) => i + 0);

  // whether or not we're in edit mode
  public editMode = EditMode

  // the currently editing plants last water date
  editingPlantLastWaterDate = new FormControl(new Date());
  editingPlantLastFertilizeDate = new FormControl(new Date());
  editingPlantLastMoistDate = new FormControl('');

  // whether or not the view is condensed
  condensedView: boolean = false;

  // the image, if any, the user wishes to upload for their plant via the 
  // add/edit form
  selectedImage: File | null = null;

  // handle image preview when the edit/add form is open
  selectedImagePreview_safe: SafeUrl | null = null;
  selectedImagePreview: string = "/assets/placeholder.jpg"

  // whether or not the plants page is waiting for the backend
  isLoading: boolean = false;

  // whether or not the backend is processing a form
  isProcessingAddOrUpdate: boolean = false;

  // whether or not the edit/add plant form is open
  addOrEditMode: EditMode = EditMode.NEITHER

  // the plant currently being edited
  editingPlant: Plant | null = null

  // list of view filters
  filters = new Map<string, boolean>();

  // list of tags that we're filtering on, if any
  filterTags: string[] = []

  // list of usernames that we're filtering on, if any
  filterUsernames: string[] = []

  // list of tags available for selection in either filtering or when editing a 
  // plant
  tags: string[] = []

  // list of usernames available for selection in either filtering or when editing a 
  // plant
  usernames: string[] = []


  // the plant edit/add form
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.min(3), Validators.max(30)]),
    tag: new FormControl('', [Validators.required, Validators.min(3), Validators.max(30)]),
    publicOrPrivate: new FormControl('', [Validators.required]),
    doNotify: new FormControl(false),
    wateringFrequency: new FormControl(1, [Validators.required]),
    fertilizingFrequency: new FormControl(0, [Validators.required]),
    lastWateredDate: new FormControl('', [Validators.required]),
    lastFertilizedDate: new FormControl('', [Validators.required])
  });

  needsCaring = PlantsService.NeedsCare;

  constructor(
    private sanitizer: DomSanitizer,
    public plantsService: PlantsService,
    private formBuilder: FormBuilder,
    public authenticationService: AuthenticationService,
  ) {
    this.form = this.formBuilder.group({
      publicOrPrivate: ['private'],
      doNotify: [false],
      name: [''],
      wateringFrequency: [1],
      fertilizingFrequency: [0],
      lastWateredDate: [''],
      lastFertilizedDate: [''],
      tag: ['']
    });
  }

  ngOnInit(): void {
    // set the filters
    this.loadFiltersFromLocalStorage()

    // the plant service lets us know if it's waiting on plants from the backend here
    this.plantsService.isLoading.subscribe((x) => { if (x) { this.isLoading = true } else { this.isLoading = false } })

    // sanitize the selected preview image URL for display at the frontend
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);

    // listen for plants so we can add all tags for selection
    this.plantsService.plants$.subscribe((x) => {
      x.forEach((plant) => {
        this.addTag(plant.tag)
        this.addUsername(plant.username)
      });
    })

    // on init, ask for the list of plants
    this.plantsService.getPlants()
  }

  private loadFiltersFromLocalStorage(): void {
    // set the UI from localStorage
    this.condensedView = localStorage.getItem("isCondensed") == "true" ? true : false
    this.filters.set("onlyMyPlants", localStorage.getItem("onlyMyPlants") == "true" ? this.authenticationService.isAuthenticated$.value : false)
    this.filters.set("needsCare", localStorage.getItem("needsCare") == "true" ? true : false)

    var existingFilterTags = localStorage.getItem("filterTags")
    if (existingFilterTags) {
      this.filterTags = JSON.parse(existingFilterTags)
    }
    var existingFilterUsernames = localStorage.getItem("filterUsernames")
    if (existingFilterUsernames) {
      this.filterUsernames = JSON.parse(existingFilterUsernames)
    }
  }

  public viewModeChanged(isCondensed: boolean): void {
    this.condensedView = isCondensed;
    localStorage.setItem("isCondensed", isCondensed ? "true" : "false")
  }

  public addFilterUsername(username: string) {
    if (!this.filterUsernames.includes(username)) {
      this.filterUsernames.push(username);
    }
    localStorage.setItem('filterUsernames', JSON.stringify(this.filterUsernames))
  }
  public removeFilterUsername(username: string) {
    const index = this.filterUsernames.indexOf(username);
    if (index > -1) {
      this.filterUsernames.splice(index, 1);
    }
    localStorage.setItem('filterUsernames', JSON.stringify(this.filterUsernames))
  }
  public addFilterTag(tag: string) {
    if (!this.filterTags.includes(tag)) {
      this.filterTags.push(tag);
    }
    localStorage.setItem('filterTags', JSON.stringify(this.filterTags))
  }
  public removeFilterTag(tag: string) {
    const index = this.filterTags.indexOf(tag);
    if (index > -1) {
      this.filterTags.splice(index, 1);
    }
    localStorage.setItem('filterTags', JSON.stringify(this.filterTags))
  }

  public usernameMatchesFilter(username: string) {
    return this.filterUsernames.length === 0 || this.filterUsernames.includes(username);
  }
  public tagMatchesFilter(tag: string) {
    return this.filterTags.length === 0 || this.filterTags.includes(tag);
  }

  public addUsername(username: string) {
    if (!this.usernames.includes(username)) {
      this.usernames.push(username);
    }
  }
  public addTag(tag: string) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }
  public removeUsername(username: string) {
    const index = this.usernames.indexOf(username);
    if (index > -1) {
      this.usernames.splice(index, 1);
    }
  }

  public removeTag(tag: string) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }
  public filterChange(filterName: string): void {
    this.filters.set(filterName, !this.filters.get(filterName))
    localStorage.setItem(filterName, (this.filters.get(filterName) ? "true" : false) || "n/a")
  }

  public isInEditOrAddMode(): boolean {
    return this.addOrEditMode !== EditMode.NEITHER
  }

  /**
   * Switch to edit mode for a given plant. 
   * @note called via Output handler for the plant component.   
   * @param event from the event emitter in the plant component.
   */
  public switchToditPlantMode(event: any): void {
    let plant: Plant = event.plant
    let imageUrl = event.imageUrl
    this.editingPlant = plant
    this.setPlantFormData(this.editingPlant, imageUrl)
    this.addOrEditMode = EditMode.EDIT
  }

  public switchToAddPlantMode(): void {
    console.log("Switching to add plant mode...")
    this.editingPlant = PlantsService.PlantsFactory.makePlant("",
      1,
      0,
      new Date().toDateString(),
      new Date().toDateString(),
      "", // starts off with no moist date, right now the user can't set this in add
      "Generic",
      false,
      true,
      [])
    this.setPlantFormData(this.editingPlant, null)
    this.addOrEditMode = EditMode.ADD;
  }

  private setPlantFormData(plant: Plant, imageUrl: string | null) {
    this.form.controls.name.setValue(plant.name)
    this.form.controls.tag.setValue(plant.tag)
    this.form.controls['wateringFrequency'].setValue(plant.wateringFrequency)
    this.form.controls['fertilizingFrequency'].setValue(plant.fertilizingFrequency)
    this.editingPlantLastWaterDate = new FormControl(new Date(plant.lastWaterDate));
    this.editingPlantLastFertilizeDate = new FormControl(new Date(plant.lastFertilizeDate));
    this.editingPlantLastMoistDate = new FormControl(plant.lastMoistDate)
    this.form.controls.publicOrPrivate.setValue(plant.isPublic ? "public" : "private")
    this.form.controls.doNotify.setValue(plant.doNotify ? true : false)
    if (imageUrl) {
      this.selectedImagePreview = imageUrl
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
  }

  /**
   * Exit the edit mode. 
   * @note Called from the 'cancel' button.
   */
  public cancelAddMode(): void {
    this.addOrEditMode = EditMode.NEITHER;
    this.selectedImagePreview = "/assets/placeholder.jpg"
    this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    this.plantsService.getPlants()
  }

  /**
   * Handle the user picking an iage to upload for their plant from the add/edit form.
   * @param event the file event from the input.
   */
  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0];
    if (this.selectedImage) {
      this.selectedImagePreview = URL.createObjectURL(this.selectedImage)
      this.selectedImagePreview_safe = this.sanitizer.bypassSecurityTrustUrl(this.selectedImagePreview);
    }
  }

  /**
   * called from the html form when 'submit' button is clicked.
   * 
   */
  addPlant() {
    if (this.form.invalid) {
      console.log("Invalid form!");
      return;
    }
    this.isProcessingAddOrUpdate = true
    var plant = PlantsService.PlantsFactory.makePlant(this.form.controls.name.value || '',
      this.form.controls.wateringFrequency.value || 0,
      this.form.controls.fertilizingFrequency.value || 0,
      this.editingPlantLastWaterDate.value?.toDateString() || '',
      this.editingPlantLastFertilizeDate.value?.toDateString() || '',
      this.editingPlantLastMoistDate.value || '',
      this.form.controls.tag.value || '',
      this.form.controls.publicOrPrivate.value == "public" || false,
      this.form.controls.doNotify.value == true || false,
      [])

    this.plantsService.formProcessingSucceeded.subscribe((x) => {
      this.isProcessingAddOrUpdate = false;
      // a backend error results in x coming in as false - don't hide the form
      if (x) {
        this.editingPlant = null
        this.addOrEditMode = EditMode.NEITHER;
        this.selectedImage = null
        this.selectedImagePreview = "/assets/placeholder.jpg"
        this.selectedImagePreview_safe = null
      }
    })
    if (this.addOrEditMode == EditMode.EDIT && this.editingPlant) {
      console.log("A plant has been edited (not added)")
      plant.id = this.editingPlant.id
      this.plantsService.updatePlant(plant, this.selectedImage)
    } else {
      this.plantsService.addPlant(plant, this.selectedImage)
    }

  }
}
