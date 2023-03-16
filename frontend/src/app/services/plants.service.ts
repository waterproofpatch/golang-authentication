import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';

import { PlantsApiService } from '../apis/plants-api.service';
import { BaseService } from './base.service';

export default interface Plant {
  id: number;
  name: string;
  wateringFrequency: string;
  lastWaterDate: string;
  imageId: number;
}

@Injectable({
  providedIn: 'root'
})
export class PlantsService extends BaseService {

  public static PlantsFactory = class {
    public static makePlant(name: string, wateringFrequency: string, lastWateredDate: string): Plant {
      const plant: Plant = {
        name: name,
        wateringFrequency: wateringFrequency,
        id: 0,
        lastWaterDate: lastWateredDate,
        imageId: 0,
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

  getPlantImage(imageId: number) {
    return this.plantsApiService.getImage(imageId)
  }

  deletePlant(id: number) {
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
      });
  }

  updatePlant(plant: Plant): void {
    this.plantsApiService
      .put(plant)
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
      });
  }
  addPlant(plant: Plant, image: File | null): void {
    const formData = new FormData();
    if (image) {
      formData.append('image', image, image.name);
    }
    formData.append('nameOfPlant', plant.name)
    formData.append('wateringFrequency', plant.wateringFrequency.toString())
    formData.append('lastWateredDate', plant.lastWaterDate)
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
        console.log('Got plants ' + x);
        x = x.sort((a: any, b: any) => a.id - b.id)
        this.plants.next(x)
        this.error$.next(''); // send a benign event so observers can close modals
      });
  }

  getPlants(): void {
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
        console.log('Got plants ' + x);
        x = x.sort((a: any, b: any) => a.id - b.id)
        this.plants.next(x)
        this.error$.next(''); // send a benign event so observers can close modals
      });
  }
}
