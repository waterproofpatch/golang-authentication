import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BaseService } from '../services/base.service';

@Injectable({
  providedIn: 'root',
})
export class ItemsApiService extends BaseService {
  itemsApiUrl = '/api/items';
  constructor(private http: HttpClient) {
    super();
  }

  get(
    id?: number,
  ): Observable<any> {
    if (id) {
      return this.http.get(
        this.getUrlBase() + this.itemsApiUrl + "?id=" + id,
        this.httpOptions
      );
    } else {
      return this.http.get(
        this.getUrlBase() + this.itemsApiUrl,
        this.httpOptions
      );
    }
  }
  delete(
    id: number,
  ): Observable<any> {
    return this.http.delete(
      this.getUrlBase() + this.itemsApiUrl + "?id=" + id,
      this.httpOptions);
  }
}
