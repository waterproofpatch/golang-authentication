import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseComponent } from '../components/base/base.component';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BaseService extends BaseComponent {
  public httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }),
  };
  constructor() {
    super();
  }
  getUrlBase(): string {
    return environment.apiUrlBase;
  }
}
