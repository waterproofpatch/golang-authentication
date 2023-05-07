import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, tap, Subject, throwError, Observable, BehaviorSubject } from 'rxjs';

import { PlantsApiService } from '../apis/plants-api.service';
import { BaseService } from './base.service';

export default interface Plant {
  id: number;
  name: string;
  username: string;
  email: string;
  wateringFrequency: number;
  fertilizingFrequency: number;
  lastWaterDate: string;
  lastFertilizeDate: string;
  imageId: number;
  isPublic: boolean;
  doNotify: boolean;
}

export enum PlantCareType {
  FERTILIZE = 1,
  WATER,
}

@Injectable({
  providedIn: 'root'
})
export class PlantsService extends BaseService {
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  imageCache: Map<number, Blob> = new Map<number, Blob>();

  /**
   * @param date to format
   * @returns formatted @c date
   */
  private static FormatDate(date: Date): string {

    const day = date.getDate().toString().padStart(2, '0'); // Get the day of the month (1-31) and pad it with a leading zero if necessary
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get the month (0-11), add 1 to get the month as a number (1-12), and pad it with a leading zero if necessary
    const year = date.getFullYear().toString(); // Get the year (4 digits)

    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate
  }
  public static NeedsFertilizing(plant: Plant) {
    var nextFertilizeDate = new Date()
    var lastFertilizeDate = new Date(plant.lastFertilizeDate)
    nextFertilizeDate.setFullYear(lastFertilizeDate.getFullYear());
    nextFertilizeDate.setMonth(lastFertilizeDate.getMonth());
    var frequencyInMs = plant.fertilizingFrequency * 24 * 60 * 60 * 1000;
    nextFertilizeDate.setTime(lastFertilizeDate.getTime() + frequencyInMs);
    let fertilizingDate = PlantsService.FormatDate(nextFertilizeDate)
    if (new Date(fertilizingDate) < new Date() && plant.fertilizingFrequency > 0) {
      return true;
    }
    return false;
  }
  public static NeedsCare(plant: Plant) {
    var nextWaterDate = new Date()
    var nextFertilizeDate = new Date()
    var lastWaterDate = new Date(plant.lastWaterDate)
    var lastFertilizeDate = new Date(plant.lastFertilizeDate)
    nextWaterDate.setFullYear(lastWaterDate.getFullYear());
    nextWaterDate.setMonth(lastWaterDate.getMonth());
    nextFertilizeDate.setFullYear(lastFertilizeDate.getFullYear());
    nextFertilizeDate.setMonth(lastFertilizeDate.getMonth());
    var frequencyInMsWater = plant.wateringFrequency * 24 * 60 * 60 * 1000;
    var frequencyInMsFertilize = plant.fertilizingFrequency * 24 * 60 * 60 * 1000;
    nextWaterDate.setTime(lastWaterDate.getTime() + frequencyInMsWater);
    nextFertilizeDate.setTime(lastFertilizeDate.getTime() + frequencyInMsFertilize);
    let wateringDate = PlantsService.FormatDate(nextWaterDate)
    if (new Date(wateringDate) < new Date()) {
      return true;
    }
    let fertilizingDate = PlantsService.FormatDate(nextFertilizeDate)
    if (new Date(fertilizingDate) < new Date() && plant.fertilizingFrequency > 0) {
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
      console.log(`imageId: ${plant.imageId}`);
      console.log(`isPublic: ${plant.isPublic}`);
      console.log(`doNotify: ${plant.doNotify}`);
    }

    public static makePlant(name: string,
      wateringFrequency: number,
      fertilizingFrequency: number,
      lastWateredDate: string,
      lastFertilizeDate: string,
      isPublic: boolean,
      doNotify: boolean): Plant {
      console.log("makePlant: isPublic=" + isPublic)
      const date = new Date(Date.parse(lastWateredDate));
      console.log("Original last water date: " + lastWateredDate + ", new lastWaterDate: " + date)
      const plant: Plant = {
        name: name,
        wateringFrequency: wateringFrequency,
        fertilizingFrequency: fertilizingFrequency,
        lastWaterDate: lastWateredDate,
        lastFertilizeDate: lastFertilizeDate,
        id: 0, // authoritative
        username: "", // authoritative
        email: "", // authoritative
        imageId: 0, // TODO improve how this is set.
        isPublic: isPublic,
        doNotify: doNotify,
      }
      return plant;
    }
  }
  // this error string is for modals to display login or registration errors.
  error$ = new Subject<string>();

  plants = new Subject<Plant[]>();

  constructor(
    private plantsApiService: PlantsApiService,
  ) {
    super()
  }

  /**
   * Make a request to the backend to get the image by imageId.
   * @param imageId the imageId to obtain.
   * @returns observable
   */
  public getPlantImage(imageId: number): Observable<any> {
    let blob = this.imageCache.get(imageId)
    if (blob) {
      console.log("Obtaining blob from cache...")
      return of(blob)
    }
    return this.plantsApiService.getImage(imageId).pipe(
      tap((imageContent: any) => {
        console.log("Tapping... " + imageContent)
        this.imageCache.set(imageId, imageContent)
      })
    );
  }

  /**
   * Delete an existing plant by its ID
   * @param id ID of the plant to delete.
   */
  public deletePlant(id: number) {
    this.isLoading.next(true)
    this.plantsApiService
      .delete(id)
      .pipe(
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
        console.log('Got plants ' + x);
        x = x.sort((a: any, b: any) => a.id - b.id)
        this.plants.next(x)
        this.error$.next(''); // send a benign event so observers can close modals
        this.isLoading.next(false)
      });
  }

  /**
   * Update an existing plant.
   * @param plant the plant to update.
   * @param image optional new image to use.
   */
  public updatePlant(plant: Plant, image: File | null): void {
    this.isLoading.next(true)
    const formData = new FormData();
    if (image) {
      formData.append('image', image, image.name);
    }
    formData.append('id', plant.id.toString())
    formData.append('nameOfPlant', plant.name)
    formData.append('wateringFrequency', plant.wateringFrequency.toString())
    formData.append('fertilizingFrequency', plant.fertilizingFrequency.toString())
    formData.append('lastFertilizeDate', plant.lastFertilizeDate.toString())
    formData.append('lastWateredDate', plant.lastWaterDate)
    formData.append('isPublic', plant.isPublic.toString())
    formData.append('doNotify', plant.doNotify.toString())
    this.plantsApiService
      .putFormData(formData)
      .pipe(
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
      });
  }

  /**
   * Add a new plant.
   * @param plant a new plant, from the factory method.
   * @param image optional the image file
   */
  public addPlant(plant: Plant, image: File | null): void {
    this.isLoading.next(true)
    const formData = new FormData();
    if (image) {
      formData.append('image', image, image.name);
    }
    formData.append('nameOfPlant', plant.name)
    formData.append('wateringFrequency', plant.wateringFrequency.toString())
    formData.append('fertilizingFrequency', plant.fertilizingFrequency.toString())
    formData.append('lastWateredDate', plant.lastWaterDate)
    formData.append('lastFertilizeDate', plant.lastFertilizeDate)
    formData.append('isPublic', plant.isPublic.toString())
    formData.append('doNotify', plant.doNotify.toString())
    this.plantsApiService
      .postFormData(formData)
      .pipe(
        catchError((error: any) => {
          this.isLoading.next(false)
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
        console.log("Updating plant list!")
        this.updatePlantsList(x)
      });
  }

  /**
   * Get a list of plants.
   */
  public getPlants(): void {
    this.isLoading.next(true)
    this.plantsApiService
      .get()
      .pipe(
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
      });
  }

  /**
   * Handle updating the list of plants from the API service (put, post, get, etc.)
   * @param plants new plants.
   */
  private updatePlantsList(plants: Plant[]): void {
    console.log('Updating plants list to: ' + plants);
    for (let p of plants) {
      PlantsService.PlantsFactory.printPlant(p)
    }
    plants = plants.sort((a: any, b: any) => a.id - b.id)
    this.plants.next(plants)
    this.error$.next(''); // send a benign event so observers can close modals
    this.isLoading.next(false)
  }
}
