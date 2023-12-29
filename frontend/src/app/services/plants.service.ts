import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, from, of, tap, Subject, throwError, Observable, BehaviorSubject } from 'rxjs';

import { Plant } from '../models/plant.model';
import { BaseService } from './base.service';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class PlantsService extends BaseService {
  formProcessingSucceeded$: Subject<boolean> = new Subject<boolean>()
  imageCache: Map<number, Blob> = new Map<number, Blob>();

  // list of plants, updated by getPlants
  plants$: BehaviorSubject<Plant[]> = new BehaviorSubject<Plant[]>([])

  // set of tags available for selection in either filtering or when editing a 
  // plant
  tags = new Set<string>()

  // set of usernames available for selection in either filtering or when editing a 
  // plant
  usernames = new Set<string>();

  // urls for backend requests
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
        this.getPlants();
      }
    })
  }

  /**
   * create a Plant object from a backend plant response. 
   * @param plant response from backend
   * @returns a Plant object
   */
  private mapPlant(plant: any): Plant {
    return new Plant(
      plant.ID,
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
    this.isLoading$.next(true)
    this.delete(id)
      .pipe(
        map((plants: Plant[]) => plants.map(plant => this.mapPlant(plant))),
        map((plants: Plant[]) => {
          return plants.sort((a: Plant, b: Plant) => this.getDaysUntilNextCareActivity(a) - this.getDaysUntilNextCareActivity(b))
        }),
        catchError((error: any) => {
          this.isLoading$.next(false)
          if (error instanceof HttpErrorResponse) {
          } else {
          }
          return throwError(error);
        })
      )
      .subscribe((x) => {
        this.updatePlantsList(x)
        this.isLoading$.next(false)
      });
  }

  // plant's that have moist soil make a PUT request 
  public markMoist(plant: Plant): void {
    const formData = new FormData();
    formData.append('plant', JSON.stringify(plant));
    this.put(formData)
      .pipe(
        map((plants: Plant[]) => plants.map(plant => this.mapPlant(plant))),
        map((plants: Plant[]) => {
          return plants.sort((a: Plant, b: Plant) => this.getDaysUntilNextCareActivity(a) - this.getDaysUntilNextCareActivity(b))
        }),
        catchError((error: any) => {
          this.formProcessingSucceeded$.next(false)
          if (error instanceof HttpErrorResponse) {
          } else {
          }
          return of(null)
        })
      )
      .subscribe((x) => {
        if (x == null) {
          return
        }
        this.formProcessingSucceeded$.next(true)
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
    formData.append('plant', JSON.stringify(plant));
    this.put(formData)
      .pipe(
        map((plants: Plant[]) => plants.map(plant => this.mapPlant(plant))),
        map((plants: Plant[]) => {
          return plants.sort((a: Plant, b: Plant) => this.getDaysUntilNextCareActivity(a) - this.getDaysUntilNextCareActivity(b))
        }),
        catchError((error: any) => {
          this.formProcessingSucceeded$.next(false)
          if (error instanceof HttpErrorResponse) {
          } else {
          }
          return of(null)
        })
      )
      .subscribe((x) => {
        if (x == null) {
          return
        }
        this.formProcessingSucceeded$.next(true)
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
    formData.append('plant', JSON.stringify(plant));
    this.post(formData)
      .pipe(
        map((plants: Plant[]) => plants.map(plant => this.mapPlant(plant))),
        map((plants: Plant[]) => {
          return plants.sort((a: Plant, b: Plant) => this.getDaysUntilNextCareActivity(a) - this.getDaysUntilNextCareActivity(b))
        }),
        catchError((error: any) => {
          this.formProcessingSucceeded$.next(false)
          if (error instanceof HttpErrorResponse) {
          } else {
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
        this.formProcessingSucceeded$.next(true)
        this.updatePlantsList(x)
      });
  }


  /**
   * Get a list of plants.
   */
  public getPlants(): void {
    this.isLoading$.next(true)
    this.get()
      .pipe(
        map((plants: Plant[]) => plants.map(plant => this.mapPlant(plant))),
        map((plants: Plant[]) => {
          return plants.sort((a: Plant, b: Plant) => this.getDaysUntilNextCareActivity(a) - this.getDaysUntilNextCareActivity(b))
        }),
        catchError((error: any) => {
          this.isLoading$.next(false)
          if (error instanceof HttpErrorResponse) {
          } else {
          }
          return throwError(error);
        })
      )
      .subscribe((plants: Plant[]) => {
        this.updatePlantsList(plants);
      });
  }


  /**
   * get a plant by its id
   * @param id the id of the plant to get
   * @returns a plant
   */
  public getPlantById(id: number): Observable<Plant> {
    return this.http.get<Plant>(
      this.getUrlBase() + this.plantsApiUrl + "/" + id,
      this.httpOptions
    );
  }

  /**
   * Handle updating the list of plants from the API service (put, post, get, etc.)
   * @param plants new plants.
   */
  private updatePlantsList(plants: Plant[]): void {
    // handle case where plants were removed from server copy
    console.log(`updating plant list with ${plants.length}`)
    this.plants$.next(plants)
    plants.forEach((x) => {
      this.tags.add(x.tag)
      this.usernames.add(x.username)
    })
    this.isLoading$.next(false)
  }

  private getDaysUntilNextCareActivity(plant: Plant): number {
    // Convert string dates to Date objects
    let lastWaterDate = new Date(plant.lastWaterDate);
    let lastMoistDate: Date | null = plant.lastMoistDate ? new Date(plant.lastMoistDate) : null;
    let lastFertilizeDate: Date | null = (plant.lastFertilizeDate && plant.fertilizingFrequency > 0) ? new Date(plant.lastFertilizeDate) : null;

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

    // Calculate the difference in days between the future date and the current date
    let diffInTime = earliestCareDate.getTime() - new Date().getTime();
    let diffInDays = diffInTime / (1000 * 3600 * 24);

    return diffInDays;
  }
  private post(formData: FormData): Observable<Plant[]> {
    return this.http.post<Plant[]>(this.getUrlBase() + this.plantsApiUrl, formData, this.httpOptionsNonJson);
  }
  private put(formData: FormData): Observable<Plant[]> {
    return this.http.put<Plant[]>(this.getUrlBase() + this.plantsApiUrl, formData, this.httpOptionsNonJson);
  }
  private get(): Observable<Plant[]> {
    return this.http.get<Plant[]>(
      this.getUrlBase() + this.plantsApiUrl,
      this.httpOptions
    );
  }
  private delete(id: number): Observable<Plant[]> {
    return this.http.delete<Plant[]>(
      this.getUrlBase() + this.plantsApiUrl + "/" + id,
      this.httpOptions);
  }
  private getImage(id: number): Observable<any> {
    return this.http.get(this.getUrlBase() + this.imagesApiUrl + '/' + id, { responseType: 'blob', headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  /**
   * get a list of plants that are mine.
   * @returns a list of plants where the username matches the username of the authenticated user
   */
  public getPlantsForMode(mode: string): Observable<Plant[]> {
    console.log(`mode=${mode}`)
    if (mode !== "public") {
      return this.plants$.pipe(
        map(plants => plants.filter(plant => plant.username === this.authenticationService.username()))
      );
    }
    else {

      return this.plants$.pipe(
        map(plants => plants.filter(plant => plant.isPublic))
      );
    }
  }
}
