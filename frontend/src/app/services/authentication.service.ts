import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import jwt_decode, { JwtPayload } from 'jwt-decode';

import { BaseService } from './base.service';
import { DialogService } from './dialog.service';

interface JWTData {
  email: string;
  username: string;
}

interface RegisterResponse {
  requiresVerification: boolean
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService extends BaseService {
  loginApiUrl = '/api/login';
  logoutApiUrl = '/api/logout';
  registerApiUrl = '/api/register';
  refreshApiUrl = '/api/refresh';

  // the local storage key for tokens
  TOKEN_KEY = 'token';

  // UI can subscribe to this to reflect authentication state
  isAuthenticated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private router: Router,
    private dialogService: DialogService,
    private http: HttpClient
  ) {
    super();
    if (this.token) {
      this.isAuthenticated$.next(true);
    }
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    this.isAuthenticated$.next(false)
  }

  public setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthenticated$.next(true)
  }

  public async getFreshToken(): Promise<string | null> {
    if (!this.token || this.isTokenExpired()) {
      const result: string = await new Promise((resolve, reject) => {
        this.refresh().subscribe((x) => {
          console.log("Token refreshed, it is: " + x.token)
          resolve(x.token)
        })
      })
      console.log("Promise for new token resolved. Returning it.")
      return result
    } else {
      console.log("Token isn't expired!")
      return this.token
    }
  }

  /**
   *
   * @returns The username we're logged in with.
   */
  public get username(): string {
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
  public get email(): string {
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
   * @returns True if the current token is expired. 
   * @returns False if the current token is not set.
   */
  public isTokenExpired(): boolean {
    if (!this.token) {
      // non existent tokens cannot be expired
      return false;
    }
    const decodedToken: any = jwt_decode(this.token);
    const currentTime = Date.now() / 1000; // convert to seconds
    return decodedToken.exp < currentTime;
  }

  /**
   * 
   * @returns the token's expiration time, or the empty string if the token is unset.
   */
  public getExpirationTime(): string {
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

  /**
   * obtain the token
   */
  public get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public logout(modalText?: string, redirectToLogin?: boolean) {
    this.logoutHttp().subscribe((x) => {
      console.log("Logged out.")
    })
    this.clearToken()
    if (modalText) {
      this.dialogService.displayLogDialog(modalText);
    }
    if (redirectToLogin) {
      console.log("Redirecting to login via logout...")
      this.router.navigateByUrl('/authentication?mode=login');
      return;
    }
    this.router.navigateByUrl('/');
  }

  /**
   * 
   * @returns an observable for refreshing the token.
   */
  public refresh(): Observable<any> {
    return this.refreshHttp()
  }

  /**
   * 
   * @param email the email to register with
   * @param username the username to register with
   * @param password the password to register with
   */
  public register(
    email: string,
    username: string,
    password: string,
  ) {
    this.isLoading$.next(true)
    this.registerHttp(email, username, password)
      .pipe(
        catchError((error: any) => {
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(() => new Error("Failed registering"));
        }),
        finalize(() => this.isLoading$.next(false))
      )
      .subscribe((x: RegisterResponse) => {
        console.log('registration completed OK: ' + x.requiresVerification);
        this.error$.next(''); // send a benign event so observers can close modals
        this.router.navigateByUrl(`/authentication?mode=login&requiresVerification=${x.requiresVerification}`);
      });
  }

  /**
   * 
   * @param email the email to use for logging in
   * @param password the password to use for logging in
   */
  public login(email: string, password: string) {
    this.isLoading$.next(true)
    this.loginHttp(email, password)
      .pipe(
        catchError((error: any) => {
          if (error instanceof HttpErrorResponse) {
            this.error$.next(error.error.error_message);
          } else {
            this.error$.next('Unexpected error');
          }
          return throwError(() => new Error("Failed logging in"));
        }),
        finalize(() => this.isLoading$.next(false))
      )
      .subscribe((x) => {
        console.log('Setting token to ' + x.token);
        this.setToken(x.token)
        this.error$.next(''); // send a benign event so observers can close modals
        this.router.navigateByUrl('/');
      });
  }
  private refreshHttp(): Observable<any> {
    return this.http.get(this.getUrlBase() + this.refreshApiUrl, this.httpOptions)
  }

  private registerHttp(
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

  private logoutHttp(): Observable<any> {
    return this.http.post(this.getUrlBase() + this.logoutApiUrl, null, this.httpOptions)
  }

  private loginHttp(email: string, password: string): Observable<any> {
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
