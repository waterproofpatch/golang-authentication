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
  constructor(private http: HttpClient) {
    super();
  }

  registerHttp(
    email: string,
    password: string,
  ): Observable<any> {
    const data = {
      email: email,
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
