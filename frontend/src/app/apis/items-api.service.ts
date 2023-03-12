import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BaseService } from '../services/base.service';
import Plant from '../services/items.service';

@Injectable({
  providedIn: 'root',
})
export class ItemsApiService extends BaseService {
  itemsApiUrl = '/api/items';
  imagesApiUrl = '/api/images';
  constructor(private http: HttpClient) {
    super();
  }

  postFormData(formData: any): Observable<any> {
    return this.http.post(this.getUrlBase() + this.itemsApiUrl, formData, this.httpOptionsNonJson);
  }
  post(item: Plant): Observable<any> {
    return this.http.post(this.getUrlBase() + this.itemsApiUrl, item, this.httpOptions);
  }
  put(item: Plant): Observable<any> {
    return this.http.put(this.getUrlBase() + this.itemsApiUrl, item, this.httpOptions);
  }
  getImage(id: number): Observable<any> {
    return this.http.get(this.getUrlBase() + this.imagesApiUrl + '/' + id, { responseType: 'blob', headers: { 'Access-Control-Allow-Origin': '*' } })
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
      this.getUrlBase() + this.itemsApiUrl + "/" + id,
      this.httpOptions);
  }
}
