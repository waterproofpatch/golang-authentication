import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProfileService extends BaseService {
  versionApiUrl = '/api/version';
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  constructor(private http: HttpClient) {
    super()
  }
  getVersion(): Observable<any> {
    return this.http.get(
      this.getUrlBase() + this.versionApiUrl,
      this.httpOptions
    );
  }
}
