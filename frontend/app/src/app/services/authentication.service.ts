import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import jwt_decode from 'jwt-decode';

import { AuthenticationApiService } from '../apis/authentication-api.service';
import { BaseService } from './base.service';
import { DialogService } from './dialog.service';
import { JWTData } from '../types';

export enum IRegistrationState {
  None = 0,
  Pending,
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

  registrationState$ = new Subject<IRegistrationState>();

  constructor(
    private location: Location,
    private authenticationApiService: AuthenticationApiService,
    private router: Router,
    private dialogService: DialogService
  ) {
    super();
  }

  /**
   * Reset registration state.
   */
  resetRegistrationState(): void {
    this.registrationState$.next(IRegistrationState.None);
  }
  /**
   *
   * @returns The email address we're logged in with.
   */
  lastName(): string {
    if (!this.token) {
      return '';
    }
    try {
      return (jwt_decode(this.token) as JWTData).lastName;
    } catch (Error) {
      console.log('error decoding token');
      return '';
    }
  }
  /**
   *
   * @returns The email address we're logged in with.
   */
  firstName(): string {
    if (!this.token) {
      return '';
    }
    try {
      return (jwt_decode(this.token) as JWTData).firstName;
    } catch (Error) {
      console.log('error decoding token');
      return '';
    }
  }
  /**
   *
   * @returns The email address we're logged in with.
   */
  phone(): string {
    if (!this.token) {
      return '';
    }
    try {
      return (jwt_decode(this.token) as JWTData).phone;
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

  /**
   *
   * @returns Whether or not the token belongs to coach
   */
  isCoach(): boolean {
    if (!this.token) {
      return false;
    }
    try {
      return (jwt_decode(this.token) as JWTData).isCoach;
    } catch (Error) {
      console.log('error decoding token');
      return false;
    }
  }

  get token() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check with '.isAuthenticated' (no parens).
   */
  get isAuthenticated() {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  logout(showModal?: boolean, redirectToLogin?: boolean) {
    localStorage.removeItem(this.TOKEN_KEY);
    if (showModal) {
      this.dialogService.displayLogDialog('Logged out successfully.');
    }
    if (redirectToLogin) {
      this.router.navigateByUrl('/authentication?mode=login');
      return;
    }
    this.router.navigateByUrl('/');
  }

  register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string
  ) {
    this.authenticationApiService
      .registerHttp(email, password, firstName, lastName, phoneNumber)
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
        this.registrationState$.next(IRegistrationState.Pending);
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
        localStorage.setItem(this.TOKEN_KEY, x.token);
        this.error$.next(''); // send a benign event so observers can close modals
        this.location.back();
      });
  }
}
