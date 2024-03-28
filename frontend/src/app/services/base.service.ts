import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseComponent } from '../components/base/base.component';
import { environment } from 'src/environments/environment';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BaseService extends BaseComponent {
  // whether or not the service is still loading backend results
  isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  // this error string is for modals to display login or registration errors.
  error$ = new Subject<string>();
  // error code
  errorCode$ = new Subject<number>();

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

  public getUrlBase(): string {
    return environment.apiUrlBase;
  }
}
