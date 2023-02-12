import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, throwError, Observable } from 'rxjs';

import { ItemsApiService } from '../apis/items-api.service';
import { BaseService } from './base.service';

export interface Item {
  name: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemsService extends BaseService {
  // this error string is for modals to display login or registration errors.
  error$ = new Subject<string>();

  items = new Subject<Item[]>();

  constructor(
    private itemsApiService: ItemsApiService,
  ) {
    super()
    this.getItems()
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
