import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';

import { ItemsApiService } from '../apis/items-api.service';
import { BaseService } from './base.service';

export interface Item {
  id: number;
  name: string;
  type: number;
}

@Injectable({
  providedIn: 'root'
})
export class ItemsService extends BaseService {

  public static ItemFactory = class {
    public static makeItem(name: string, type: number): Item {
      const item: Item = {
        name: name,
        type: type,
        id: 0,
      }
      return item;
    }
  }
  // this error string is for modals to display login or registration errors.
  error$ = new Subject<string>();

  items = new Subject<Item[]>();

  constructor(
    private itemsApiService: ItemsApiService,
  ) {
    super()
    this.getItems()
  }


  deleteItem(id: number) {
    this.itemsApiService
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
        console.log('Got items ' + x);
        this.items.next(x)
        this.error$.next(''); // send a benign event so observers can close modals
      });
  }

  addItem(item: Item): void {
    this.itemsApiService
      .post(item)
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
        console.log('Got items ' + x);
        this.items.next(x)
        this.error$.next(''); // send a benign event so observers can close modals
      });
  }

  getItems(): void {
    this.itemsApiService
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
        console.log('Got items ' + x);
        this.items.next(x)
        this.error$.next(''); // send a benign event so observers can close modals
      });
  }
}
