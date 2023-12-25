import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseComponent } from '../components/base/base.component';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BaseService extends BaseComponent {
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  public httpOptionsNonJson = {
    headers: new HttpHeaders({
      'Access-Control-Allow-Origin': '*',
    }),
  };
  public httpOptions = {
    withCredentials: true,
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
