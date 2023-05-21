import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { BaseService } from '../services/base.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationApiService extends BaseService {
  loginApiUrl = '/api/login';
  registerApiUrl = '/api/register';
  refreshApiUrl = '/api/refresh';

  constructor(private http: HttpClient) {
    super();
  }

  refreshHttp(): Observable<any> {
    return this.http.get(this.getUrlBase() + this.refreshApiUrl, this.httpOptions)
  }

  registerHttp(
    email: string,
    username: string,
    password: string,
  ): Observable<any> {
    const data = {
      email: email,
      username: username,
      password: password,
    };
    return this.http.post(
      this.getUrlBase() + this.registerApiUrl,
      data,
      this.httpOptions
    );
  }

  loginHttp(email: string, password: string): Observable<any> {
    const data = {
      email: email,
      password: password,
    };

    return this.http.post(
      this.getUrlBase() + this.loginApiUrl,
      data,
      this.httpOptions
    );
  }
}
