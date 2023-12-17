import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, from, of, tap, Subject, throwError, Observable, BehaviorSubject } from 'rxjs';

import { PlantLog, Comment } from '../types';
import { Plant } from '../models/plant.model';
import { BaseService } from './base.service';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class PlantsService extends BaseService {
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  formProcessingSucceeded: Subject<boolean> = new Subject<boolean>()
  imageCache: Map<number, Blob> = new Map<number, Blob>();

  /**
   * @param date to format
   * @returns formatted @c date
   */
  public static FormatDate(date: Date): string {

    const day = date.getDate().toString().padStart(2, '0'); // Get the day of the month (1-31) and pad it with a leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (0-11), add 1 to get the month as a number (1-12), and pad it with a leading zero if necessary
    const year = date.getFullYear().toString(); // Get the year (4 digits)

    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate
  }

  // this is quite possibly the most rediculous way to do this
  public static NeedsCare(plant: Plant) {
    var nextWaterDate = new Date()
    var nextFertilizeDate = new Date()
    var nextMoistDate = new Date()

    var lastWaterDate = new Date(plant.lastWaterDate)
    var lastFertilizeDate = new Date(plant.lastFertilizeDate)
    var lastMoistDate = new Date(plant.lastMoistDate)

    nextWaterDate.setFullYear(lastWaterDate.getFullYear());
    nextWaterDate.setMonth(lastWaterDate.getMonth());

    nextMoistDate.setFullYear(lastMoistDate.getFullYear());
    nextMoistDate.setMonth(lastMoistDate.getMonth());

    nextFertilizeDate.setFullYear(lastFertilizeDate.getFullYear());
    nextFertilizeDate.setMonth(lastFertilizeDate.getMonth());

    var frequencyInMsWater = plant.wateringFrequency * 24 * 60 * 60 * 1000;
    var frequencyInMsFertilize = plant.fertilizingFrequency * 24 * 60 * 60 * 1000;
    var frequencyInMsMoist = 1 * 24 * 60 * 60 * 1000;

    nextWaterDate.setTime(lastWaterDate.getTime() + frequencyInMsWater);
    nextFertilizeDate.setTime(lastFertilizeDate.getTime() + frequencyInMsFertilize);
    nextMoistDate.setTime(lastMoistDate.getTime() + frequencyInMsMoist);

    let wateringDate = PlantsService.FormatDate(nextWaterDate)
    if (new Date(wateringDate) < new Date() && plant.lastMoistDate == '') {
      return true;
    }
    let fertilizingDate = PlantsService.FormatDate(nextFertilizeDate)
    if (new Date(fertilizingDate) < new Date() && plant.fertilizingFrequency > 0) {
      return true;
    }
    let moistDate = PlantsService.FormatDate(nextMoistDate)
    if (new Date(moistDate) < new Date() && plant.lastMoistDate != '') {
      return true;
    }
    return false;
  }

  public static PlantsFactory = class {
    public static printPlant(plant: Plant): void {
      console.log("plantsFactort.printPlant:")
      console.log(`id: ${plant.id}`);
      console.log(`name: ${plant.name}`);
      console.log(`username: ${plant.username}`);
      console.log(`email: ${plant.email}`);
      console.log(`wateringFrequency: ${plant.wateringFrequency}`);
      console.log(`fertilizingFrequency: ${plant.fertilizingFrequency}`);
      console.log(`lastWaterDate: ${plant.lastWaterDate}`);
      console.log(`lastFertilizeDate: ${plant.lastFertilizeDate}`);
      console.log(`lastMoistDate: ${plant.lastMoistDate}`);
      console.log(`skippedLastFertilize: ${plant.skippedLastFertilize}`);
      console.log(`tag: ${plant.tag}`);
      console.log(`imageId: ${plant.imageId}`);
      console.log(`isPublic: ${plant.isPublic}`);
      console.log(`doNotify: ${plant.doNotify}`);
      console.log(`logs: ${plant.logs}`);
    }

    public static makePlant(name: string,
      wateringFrequency: number,
      fertilizingFrequency: number,
      lastWateredDate: Date,
      lastFertilizeDate: Date,
      lastMoistDate: string,
      tag: string,
      isPublic: boolean,
      doNotify: boolean,
      logs: PlantLog[],
      comments: Comment[],
    ): Plant {
      let plant: Plant = new Plant(
        0, // id
        name,
        "", // username
        "", // email
        wateringFrequency,
        fertilizingFrequency,
        PlantsService.FormatDate(lastWateredDate),
        PlantsService.FormatDate(lastFertilizeDate),
        lastMoistDate,
        false, // skippedLastFertilize
        tag,
        0, //imageId,
        isPublic,
        doNotify,
        logs,
        comments,
        "", // notes

      )
      return plant;
    }
  }
  // this error string is for modals to display login or registration errors.
  error$ = new Subject<string>();

  // list of plants, updated by getPlants
  plants: Plant[] = []

  // set of tags available for selection in either filtering or when editing a 
  // plant
  tags = new Set<string>()

  // set of usernames available for selection in either filtering or when editing a 
  // plant
  usernames = new Set<string>();

  plantsInfoApiUrl = '/api/plantsInfo';
  plantsApiUrl = '/api/plants';
  imagesApiUrl = '/api/images';

  constructor(
    private authenticationService: AuthenticationService,
    private http: HttpClient
  ) {
    super()
    this.authenticationService.isAuthenticated$.subscribe((isAuth: boolean) => {
      // if the user logs out after having previously loaded a plant list, update the plant list 
      // so they're not seeing cached authenticated-only plants.
      if (!isAuth) {

        console.log("logout event detected, getting updated plants list...")
        this.plants = []
        this.getPlants();
      }
    })
  }

  /**
   * Make a request to the backend to get the image by imageId.
   * @param imageId the imageId to obtain.
   * @returns observable
   */

  getPlantImage(imageId: number): Observable<any> {
    const request = new Request(`/my-data-store/${imageId}`);
    return from(
      caches.open('my-cache').then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            console.log(`Image with id ${imageId} found in cache`);
            return response.blob();
          } else {
            console.log(`Image with id ${imageId} not found in cache, requesting from API`);
            return this.getImage(imageId).pipe(
              tap(imageBlob => {
                const imageResponse = new Response(imageBlob);
                cache.put(request, imageResponse);
              })
            ).toPromise();
          }
        });
      })
    );
  }



  /**
   * Delete an existing plant by its ID
   * @param id ID of the plant to delete.
   */
  public deletePlant(id: number) {
    this.isLoading.next(true)
    this.delete(id)
      .pipe(
        map((plants: any[]) => plants.map(plant => this.mapPlant(plant))),
        catchError((error: any) => {
          this.isLoading.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(error);
        })
      )
      .subscribe((x) => {
        this.updatePlantsList(x)
        this.error$.next(''); // send a benign event so observers can close modals
        this.isLoading.next(false)
      });
  }

  // plant's that have moist soil make a PUT request 
  public markMoist(plant: Plant): void {
    const formData = new FormData();
    formData.append("id", plant.id.toString())
    this.putMoist(formData)
      .pipe(
        map((plants: any[]) => plants.map(plant => this.mapPlant(plant))),
        catchError((error: any) => {
          this.formProcessingSucceeded.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return of(null)
        })
      )
      .subscribe((x) => {
        if (x == null) {
          return
        }
        this.formProcessingSucceeded.next(true)
        this.updatePlantsList(x)
      });
  }
  /**
   * Update an existing plant.
   * @param plant the plant to update.
   * @param image optional new image to use.
   */
  public updatePlant(plant: Plant, image: File | null): void {
    const formData = new FormData();
    if (image) {
      formData.append('image', image, image.name);
    }
    formData.append('id', plant.id.toString())
    formData.append('nameOfPlant', plant.name)
    formData.append('wateringFrequency', plant.wateringFrequency.toString())
    formData.append('fertilizingFrequency', plant.fertilizingFrequency.toString())
    formData.append('lastFertilizeDate', plant.lastFertilizeDate)
    formData.append('lastWateredDate', plant.lastWaterDate)
    formData.append('lastMoistDate', plant.lastMoistDate)
    formData.append('skippedLastFertilize', plant.skippedLastFertilize ? "true" : "false")
    formData.append('tag', plant.tag)
    formData.append('isPublic', plant.isPublic.toString())
    formData.append('doNotify', plant.doNotify.toString())
    formData.append('notes', plant.notes)
    this.putFormData(formData)
      .pipe(
        map((plants: any[]) => plants.map(plant => this.mapPlant(plant))),
        catchError((error: any) => {
          this.formProcessingSucceeded.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return of(null)
        })
      )
      .subscribe((x) => {
        if (x == null) {
          return
        }
        this.formProcessingSucceeded.next(true)
        this.updatePlantsList(x)
      });
  }

  /**
   * Add a new plant.
   * @param plant a new plant, from the factory method.
   * @param image optional the image file
   */
  public addPlant(plant: Plant, image: File | null): void {
    const formData = new FormData();
    if (image) {
      formData.append('image', image, image.name);
    }
    formData.append('nameOfPlant', plant.name)
    formData.append('wateringFrequency', plant.wateringFrequency.toString())
    formData.append('fertilizingFrequency', plant.fertilizingFrequency.toString())
    formData.append('lastWateredDate', plant.lastWaterDate)
    formData.append('lastFertilizeDate', plant.lastFertilizeDate)
    formData.append('tag', plant.tag)
    formData.append('isPublic', plant.isPublic.toString())
    formData.append('doNotify', plant.doNotify.toString())
    this.postFormData(formData)
      .pipe(
        map((plants: any[]) => plants.map(plant => this.mapPlant(plant))),
        catchError((error: any) => {
          this.formProcessingSucceeded.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          // return throwError(error);
          return of(null)
        })
      )
      .subscribe((x) => {
        if (x == null) {
          console.log("NULL!")
          return;
        }
        this.formProcessingSucceeded.next(true)
        this.updatePlantsList(x)
      });
  }

  private mapPlant(plant: any): Plant {
    return new Plant(
      plant.id,
      plant.name,
      plant.username,
      plant.email,
      plant.wateringFrequency,
      plant.fertilizingFrequency,
      plant.lastWaterDate,
      plant.lastFertilizeDate,
      plant.lastMoistDate,
      plant.skippedLastFertilize,
      plant.tag,
      plant.imageId,
      plant.isPublic,
      plant.doNotify,
      plant.logs,
      plant.comments,
      plant.notes
    )
  }

  /**
   * Get a list of plants.
   */
  public getPlants(): void {
    this.isLoading.next(true)
    this.get()
      .pipe(
        map((plants: any[]) => plants.map(plant => this.mapPlant(plant))),
        catchError((error: any) => {
          this.isLoading.next(false)
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(error);
        })
      )
      .subscribe((plants: Plant[]) => {
        this.updatePlantsList(plants);
      });
  }


  public getPlant(id: number): Observable<Plant> {
    return this.getById(id = id) as Observable<Plant>
  }

  /**
   * Handle updating the list of plants from the API service (put, post, get, etc.)
   * @param plants new plants.
   */
  private updatePlantsList(plants: Plant[]): void {
    // handle case where plants were removed from server copy
    console.log('type of plants: ' + typeof (plants))
    this.plants = this.plants.filter(plant => plants.some(p => p.id === plant.id));
    plants = plants.sort((a: Plant, b: Plant) => this.getDaysUntilNextCareActivity(a) - this.getDaysUntilNextCareActivity(b))

    for (let p of plants) {
      // update tag/username bookkeeping
      this.tags.add(p.tag)
      this.usernames.add(p.username)

      if (!this.plants.some(plant => plant.id === p.id)) {
        console.log("New plant " + p.id + '(' + p.name + ')')
        this.plants.push(p)
      } else {
        let plantToUpdate = this.plants.findIndex(plant => plant.id === p.id);
        let hash1 = this.computeHash(this.plants[plantToUpdate])
        let hash2 = this.computeHash(p)
        if (hash2 != hash1) {
          console.log("Need to update plant id=" + p.id)
          this.plants[plantToUpdate] = p;
        }
      }
    }
    this.error$.next(''); // send a benign event so observers can close modals
    this.isLoading.next(false)
  }

  private computeHash(plant: Plant): string {
    let hash = 0;
    let plantString = JSON.stringify(plant);
    for (let i = 0; i < plantString.length; i++) {
      let char = plantString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private getDaysUntilNextCareActivity(plant: Plant): number {
    // Convert string dates to Date objects
    let lastWaterDate = new Date(plant.lastWaterDate);
    let lastMoistDate: Date | null = plant.lastMoistDate ? new Date(plant.lastMoistDate) : null;
    let lastFertilizeDate: Date | null = (plant.lastFertilizeDate && plant.fertilizingFrequency > 0) ? new Date(plant.lastFertilizeDate) : null;

    console.log(plant.plantToString());

    let nextWaterCareDate = new Date();
    nextWaterCareDate.setTime(lastWaterDate.getTime() + plant.wateringFrequency * 24 * 60 * 60 * 1000);

    let nextFertilizeCareDate: Date | null = null;
    if (lastFertilizeDate) {
      nextFertilizeCareDate = new Date();
      nextFertilizeCareDate.setTime(lastFertilizeDate.getTime() + plant.fertilizingFrequency * 24 * 60 * 60 * 1000);
    }

    let nextMoistCareDate: Date | null = null;
    if (lastMoistDate) {
      nextMoistCareDate = new Date();
      nextMoistCareDate.setTime(lastMoistDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    }

    let careDates = [nextWaterCareDate.getTime()];
    if (nextFertilizeCareDate) {
      careDates.push(nextFertilizeCareDate.getTime());
    }
    if (nextMoistCareDate) {
      careDates.push(nextMoistCareDate.getTime());
    }

    let earliestCareDate = new Date(Math.min(...careDates));
    console.log("earlierCareDate: " + earliestCareDate);

    // Calculate the difference in days between the future date and the current date
    let diffInTime = earliestCareDate.getTime() - new Date().getTime();
    let diffInDays = diffInTime / (1000 * 3600 * 24);

    console.log(plant.name + ' next care activity due in: ' + diffInDays + ' days');
    return diffInDays;
  }
  postFormData(formData: any): Observable<Plant[]> {
    return this.http.post<Plant[]>(this.getUrlBase() + this.plantsApiUrl, formData, this.httpOptionsNonJson);
  }
  putFormData(formData: any): Observable<Plant[]> {
    return this.http.put<Plant[]>(this.getUrlBase() + this.plantsApiUrl, formData, this.httpOptionsNonJson);
  }
  putMoist(formData: any): Observable<Plant[]> {
    return this.http.put<Plant[]>(this.getUrlBase() + this.plantsApiUrl + "?moist=true", formData, this.httpOptionsNonJson)
  }
  post(plant: Plant): Observable<Plant[]> {
    return this.http.post<Plant[]>(this.getUrlBase() + this.plantsApiUrl, plant, this.httpOptions);
  }
  put(plant: Plant): Observable<Plant[]> {
    console.log("Updating plant " + plant.id)
    return this.http.put<Plant[]>(this.getUrlBase() + this.plantsApiUrl, plant, this.httpOptions);
  }
  getImage(id: number): Observable<any> {
    return this.http.get(this.getUrlBase() + this.imagesApiUrl + '/' + id, { responseType: 'blob', headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  getById(
    id: number,
  ): Observable<Plant> {
    return this.http.get<Plant>(
      this.getUrlBase() + this.plantsApiUrl + "/" + id,
      this.httpOptions
    );
  }
  get(): Observable<Plant[]> {
    return this.http.get<Plant[]>(
      this.getUrlBase() + this.plantsApiUrl,
      this.httpOptions
    );
  }
  delete(
    id: number,
  ): Observable<Plant[]> {
    return this.http.delete<Plant[]>(
      this.getUrlBase() + this.plantsApiUrl + "/" + id,
      this.httpOptions);
  }
}
