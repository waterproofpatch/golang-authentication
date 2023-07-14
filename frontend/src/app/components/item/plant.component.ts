import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DialogService, PlantCareDialogData } from 'src/app/services/dialog.service';
import { Plant, PlantCareType, PlantsService } from 'src/app/services/plants.service';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';
import { CommentsService } from 'src/app/services/comments.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.css']
})
export class PlantComponent {
  panelOpenState: boolean = false;
  plantCareType = PlantCareType

  // passed from the parent component
  @Input() plant?: Plant

  // whether or not we're supposed to take up less screen space per plant
  @Input() isCondensed?: boolean

  // whether or not this plant is overdue for watering
  needsWatering: boolean = false

  // whether or not this plant is overdue for fertilizing
  needsFertilizing: boolean = false

  // the username for our user from the authentication service
  // TODO make this something we subscribe to
  username: string = ''

  // whether or not the image for this plant is in progress loading
  isImageLoading: boolean = false

  // filled out by getImage when the image loads - this is the string to render 
  // at the frontend with <img [src]="imageUrl">
  imageUrl: string | null = null

  // when user clicks the "edit" button on this plant
  @Output() editModeEmitter = new EventEmitter<{ plant: Plant, imageUrl: string | null }>()

  // color for text for the 'next care date' - set to red for plants in need of care
  backgroundColorMoist: string = 'orange';
  backgroundColorWater: string = 'black';
  backgroundColorFertilize: string = 'black';

  numComments: BehaviorSubject<number> = new BehaviorSubject<number>(0)

  constructor(private router: Router,
    private plantService: PlantsService,
    private dialogService: DialogService,
    private commentsService: CommentsService,
    private authenticationService: AuthenticationService) {
    this.isCondensed = false // deafult value

  }

  ngOnInit() {
    this.username = this.authenticationService.username()
    this.getImage()
    if (new Date(this.getNextFertilizeDate()) < new Date()) {
      if (this.plant) {
        if (this.plant.fertilizingFrequency > 0) {
          this.backgroundColorFertilize = "red"
          this.needsFertilizing = true
        }
      }
    }
    if (new Date(this.getNextWaterDate()) < new Date() && this.plant?.lastMoistDate == '') {
      if (this.plant) {
        this.backgroundColorWater = "red"
        this.needsWatering = true
      }
    }
    if (new Date(this.getNextMoistCheckDate()) < new Date()) {
      if (this.plant) {
        this.backgroundColorMoist = "red"
      }
    }
    this.numComments.next(0)
    // console.log("plant " + this.plant?.id + " subbing comments")
    // this.commentsService.comments$.subscribe((x) => {
    //   console.log("plantId=" + this.plant?.id + " got " + x.length + " comments");
    //   for (let comment of x) {
    //     if (comment.plantId == this.plant?.id && !comment.viewed && this.plant?.username == this.authenticationService.username()) {

    //       this.numComments.next(this.numComments.value + 1)
    //     }
    //   }
    // })
    if (this.plant) {
      // this.commentsService.getComments(this.plant.id)
    }
  }

  /**
   * handle user editing the plant
   */
  editPlant() {
    if (!this.plant) {
      return;
    }
    this.editModeEmitter.emit({ plant: this.plant, imageUrl: this.imageUrl })
  }
  /**
   * handle user watering the plant
   */
  public waterPlant(): void {
    if (!this.plant) {
      return
    }
    let water: boolean = false
    let fertilize: boolean = false
    let moist: boolean = false
    var dialogRef = this.dialogService.displayPlantCareDialog("What did you do for " + this.plant.name + "?",
      water,
      fertilize,
      moist)
    if (this.plant == null) {
      console.log("Unexpected plant is NULL");
      return;
    }
    dialogRef.afterClosed().subscribe((result: PlantCareDialogData) => {
      console.log("water: " + result.water)
      console.log("fertilize: " + result.fertilize)
      console.log("moist: " + result.moist)
      if (result.moist && (result.water || result.fertilize)) {
        this.dialogService.displayErrorDialog("Only choose 'moist' when not choosing other care actions.")
        return;
      }
      if (result) {
        if (!this.plant) {
          return;
        }
        const currentDate = new Date();
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayOfWeek = daysOfWeek[currentDate.getDay()];
        const month = months[currentDate.getMonth()];
        const day = currentDate.getDate();
        const year = currentDate.getFullYear();
        const formattedDate = `${dayOfWeek} ${month} ${day} ${year}`;
        if (result.water) {
          console.log("Setting water date to " + formattedDate);
          this.plant.lastWaterDate = formattedDate
          this.plant.lastMoistDate = '' // unset
        }
        if (result.fertilize) {
          console.log("Setting fertilize date to " + formattedDate);
          this.plant.lastFertilizeDate = formattedDate
        }
        if (result.moist) {
          console.log("Plant is moist - only updating that attribute")
          this.plantService.markMoist(this.plant)
          return;
        }

        // not updating the image for this plant
        this.plantService.updatePlant(this.plant, null)
      } else {
        console.log("Dialog declined.")
      }
    })

  }

  /**
   * format the last water date to a string.
   * @returns formatted last water date
   */
  transformLastPlantCareDate(date: string): string {
    let myDate = new Date(date);
    return this.formatDate(myDate)
  }
  public getSortedLogs(): any {
    var sortedLogs = this.plant?.logs.slice().sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
    return sortedLogs;
  }

  /**
   * 
   * @param dbDate the date string from gorm, like from gorm.CreatedAt.
   * Example dbDate: 2023-05-24T05:31:40.232118Z
   * @returns mm/dd/yyyy h:m:s AM/PM formatted date string.
   * Example return value: 5/24/2023 5:31:40 AM
   */
  public transformGormDatabaseDate(dbDate: string): string {
    const date = new Date(dbDate);
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutes = date.getMinutes();
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hours}:${strMinutes}:${date.getSeconds()} ${ampm}`;
    return formattedDate;
  }



  /**
   * @param date to format for display in HTML - not for sending to backend.
   * @returns formatted @c date
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0'); // Get the day of the month (1-31) and pad it with a leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (0-11), add 1 to get the month as a number (1-12), and pad it with a leading zero if necessary
    const year = date.getFullYear().toString(); // Get the year (4 digits)

    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate
  }
  /**
   * obtain a formatted next-fertilize-date from the difference between this plants last fertilize date 
   * and fertilize frequency.
   * @returns the date to next fertilize this plant.
   */
  public getNextFertilizeDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    var nextFertilizeDate = new Date()
    var lastFertilizeDate = new Date(this.plant.lastFertilizeDate)
    nextFertilizeDate.setFullYear(lastFertilizeDate.getFullYear());
    nextFertilizeDate.setMonth(lastFertilizeDate.getMonth());
    var frequencyInMs = this.plant.fertilizingFrequency * 24 * 60 * 60 * 1000;
    nextFertilizeDate.setTime(lastFertilizeDate.getTime() + frequencyInMs);
    return this.formatDate(nextFertilizeDate)
  }

  /**
   * obtain a formatted next-water-date from the difference between this plants last water date 
   * and water frequency.
   * @returns the date to next water this plant.
   */
  public getNextWaterDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    var nextWaterDate = new Date()
    var lastWaterDate = new Date(this.plant.lastWaterDate)
    nextWaterDate.setFullYear(lastWaterDate.getFullYear());
    nextWaterDate.setMonth(lastWaterDate.getMonth());
    var frequencyInMs = this.plant.wateringFrequency * 24 * 60 * 60 * 1000;
    nextWaterDate.setTime(lastWaterDate.getTime() + frequencyInMs);
    return this.formatDate(nextWaterDate)
  }
  /**
   * obtain a formatted next-moist-check-date from the difference between this plants last moist date 
   * and one day.
   * @returns the date to next check moist soil for this plant.
   */
  public getNextMoistCheckDate(): string {
    if (!this.plant) {
      return "N/A"
    }
    var nextMoistDate = new Date()
    var lastMoistDate = new Date(this.plant.lastMoistDate)
    nextMoistDate.setFullYear(lastMoistDate.getFullYear());
    nextMoistDate.setMonth(lastMoistDate.getMonth());
    var frequencyInMs = 1 * 24 * 60 * 60 * 1000;
    nextMoistDate.setTime(lastMoistDate.getTime() + frequencyInMs);
    return this.formatDate(nextMoistDate)
  }

  /**
   * get the image for this plant based on its imageId
   */
  private getImage(): void {
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

  /**
   * delete this plant. Handle the 'delete' button. 
   */
  public deletePlant() {
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
