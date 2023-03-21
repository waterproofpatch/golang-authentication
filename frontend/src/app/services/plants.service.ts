import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, throwError, Observable, BehaviorSubject } from 'rxjs';

import { PlantsApiService } from '../apis/plants-api.service';
import { BaseService } from './base.service';

export default interface Plant {
  id: number;
  name: string;
  username: string;
  wateringFrequency: string;
  lastWaterDate: string;
  imageId: number;
  isPublic: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlantsService extends BaseService {
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  suggestedWateringFrequency: BehaviorSubject<number> = new BehaviorSubject<number>(0)
  suggestedWateringFrequencyRaw: BehaviorSubject<string> = new BehaviorSubject<string>("")


  public static PlantsFactory = class {
    public static printPlant(plant: Plant): void {
      console.log("PLANT:")
      console.log(`id: ${plant.id}`);
      console.log(`name: ${plant.name}`);
      console.log(`username: ${plant.username}`);
      console.log(`wateringFrequency: ${plant.wateringFrequency}`);
      console.log(`lastWaterDate: ${plant.lastWaterDate}`);
      console.log(`imageId: ${plant.imageId}`);
      console.log(`isPublic: ${plant.isPublic}`);
    }

    public static makePlant(name: string,
      wateringFrequency: string,
      lastWateredDate: string,
      isPublic: boolean): Plant {
      console.log("makePlant: isPublic=" + isPublic)
      const plant: Plant = {
        name: name,
        wateringFrequency: wateringFrequency,
        lastWaterDate: lastWateredDate,
        id: 0, // authoritative
        username: "", // authoritative
        imageId: 0, // TODO improve how this is set.
        isPublic: isPublic,
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
    return this.plantsApiService.getImage(imageId)
  }

  /**
   * Ask the backend for suggested watering frequency.
   * @param plantName name of the plant
   */
  public getPlantWateringFrequency(plantName: string): void {
    this.plantsApiService.postPlantInfoData(plantName).subscribe((x) => {
      console.log("Got watering frequency " + x.wateringFrequency)
      console.log("Got watering frequency (raw) " + x)
      this.suggestedWateringFrequency.next(x.wateringFrequency)
    })
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
    formData.append('lastWateredDate', plant.lastWaterDate)
    formData.append('isPublic', plant.isPublic.toString())
    this.plantsApiService
      .putFormData(formData)
      .pipe(
        catchError((error: any) => {
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
    formData.append('lastWateredDate', plant.lastWaterDate)
    formData.append('isPublic', plant.isPublic.toString())
    this.plantsApiService
      .postFormData(formData)
      .pipe(
        catchError((error: any) => {
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
   * Get a list of plants.
   */
  public getPlants(): void {
    this.isLoading.next(true)
    this.plantsApiService
      .get()
      .pipe(
        catchError((error: any) => {
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
    console.log('Got plants ' + plants);
    for (let p of plants) {
      PlantsService.PlantsFactory.printPlant(p)
    }
    plants = plants.sort((a: any, b: any) => a.id - b.id)
    this.plants.next(plants)
    this.error$.next(''); // send a benign event so observers can close modals
    this.isLoading.next(false)
  }
}
