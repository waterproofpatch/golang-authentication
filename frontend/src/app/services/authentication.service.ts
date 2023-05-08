import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import jwt_decode from 'jwt-decode';
import { JwtPayload } from 'jwt-decode';

import { AuthenticationApiService } from '../apis/authentication-api.service';
import { BaseService } from './base.service';
import { DialogService } from './dialog.service';
import { JWTData } from '../types';

export enum IRegistrationState {
  None = 0,
  Pending,
  Completed,
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService extends BaseService {
  // the local storage key for tokens
  TOKEN_KEY = 'token';

  // this error string is for modals to display login or registration errors.
  error$ = new Subject<string>();
  // this status string is for modals to display login or registration status messages.
  status$ = new Subject<string>();

  // UI can subscribe to this to reflect authentication state
  isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  // for models to show progress of registration
  registrationState$ = new Subject<IRegistrationState>();

  constructor(
    private authenticationApiService: AuthenticationApiService,
    private router: Router,
    private dialogService: DialogService
  ) {
    super();
    if (this.token) {
      this.isAuthenticated$.next(true);
      if (this.isTokenExpired()) {
        // this.clearToken();
        // this.dialogService.displayErrorDialog("Token exipred. Log in again.")
      } else {
        // this.isAuthenticated$.next(true);
      }
    }
  }

  private clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY)
    this.isAuthenticated$.next(false)
  }

  public setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthenticated$.next(true)
  }


  /**
   * Reset registration state.
   */
  resetRegistrationState(): void {
    this.registrationState$.next(IRegistrationState.None);
  }

  /**
   *
   * @returns The username we're logged in with.
   */
  username(): string {
    if (!this.token) {
      return '';
    }
    try {
      return (jwt_decode(this.token) as JWTData).username;
    } catch (Error) {
      console.log('error decoding token');
      return '';
    }
  }
  /**
   *
   * @returns The email address we're logged in with.
   */
  email(): string {
    if (!this.token) {
      return '';
    }
    try {
      return (jwt_decode(this.token) as JWTData).email;
    } catch (Error) {
      console.log('error decoding token');
      return '';
    }
  }

  isTokenExpired(): boolean {
    if (!this.token) {
      return true;
    }
    const decodedToken: any = jwt_decode(this.token);
    const currentTime = Date.now() / 1000; // convert to seconds
    return decodedToken.exp < currentTime;
  }
  getExpirationTime(): string {
    if (!this.token) {
      return '';
    }
    const decodedToken: JwtPayload = jwt_decode(this.token)
    if (!decodedToken || !decodedToken.exp) {
      return '';
    }
    const expDate = new Date(0)
    expDate.setUTCSeconds(decodedToken.exp);

    const expTime = expDate.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
    return expTime
  }

  get token() {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  logout(showModal?: boolean, redirectToLogin?: boolean) {
    this.clearToken()
    if (showModal) {
      this.dialogService.displayLogDialog('Logged out successfully.');
    }
    if (redirectToLogin) {
      this.router.navigateByUrl('/authentication?mode=login');
      return;
    }
    this.router.navigateByUrl('/');
  }

  refresh() {
    return this.authenticationApiService.refreshHttp()
  }

  register(
    email: string,
    username: string,
    password: string,
  ) {
    this.authenticationApiService
      .registerHttp(email, username, password)
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
        console.log('registration completed OK');
        this.error$.next(''); // send a benign event so observers can close modals
        this.registrationState$.next(IRegistrationState.Completed);
        this.router.navigateByUrl('/authentication?mode=login');
      });
  }

  login(email: string, password: string) {
    this.authenticationApiService
      .loginHttp(email, password)
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
        console.log('Setting token to ' + x.token);
        this.setToken(x.token)
        this.error$.next(''); // send a benign event so observers can close modals
        this.router.navigateByUrl('/');
      });
  }
}
