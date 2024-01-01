import { catchError, switchMap } from 'rxjs/operators';
import { throwError, tap } from 'rxjs';
import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';
import { DialogService } from './dialog.service';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  private isRefreshing: boolean = false;
  constructor(
    private injector: Injector,
    private dialogService: DialogService,
    private authenticationService: AuthenticationService
  ) { }

  private formatErrorMessage(error: any): string {
    return `${error.error["code"]}: ${error.error["error_message"]}`
  }

  intercept(req: any, next: any) {
    const authenticationService = this.injector.get(AuthenticationService);

    // put a token in each request if we have one
    const authRequest = req.clone({
      headers: req.headers.append(
        'Authorization',
        'Bearer ' + authenticationService.token
      ),
    });

    // issue that request with the token and handle any errors
    return next.handle(authRequest).pipe(
      tap((x: any) => {
        if (x.hasOwnProperty('body') && x.body != null && x.body.hasOwnProperty('token')) {
          console.log("Got a token! " + x.body.token)
          this.authenticationService.setToken(x.body.token)
        }
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          if (error.error instanceof ErrorEvent) {
            console.error('Error Event');
          } else {
            console.log(`error status : ${error.status} ${error.statusText}`);
            console.log(error.error); // Log the error object
            switch (error.status) {
              case 400:
                this.dialogService.displayErrorDialog(
                  'Bad request: ' + this.formatErrorMessage(error)
                );
                break;
              case 401: // login or token expired
                // if even the frontend doesn't think we're authenticated, then
                // user probably tried just accessing a protected endpoint
                if (!this.authenticationService.isAuthenticated$.value) {
                  this.dialogService.displayErrorDialog(`Code ${this.formatErrorMessage(error)}`)
                  this.authenticationService.logout(undefined, true)
                  break
                }

                // we may get 401 if the access token is expired
                if (!this.isRefreshing) {
                  console.log("Trying to use refresh token...")
                  this.isRefreshing = true
                  return this.authenticationService.refresh().pipe(
                    catchError(error => {
                      this.isRefreshing = false;
                      console.log('Error refreshing token:', error);
                      return throwError(error);
                    }),

                    // the refresh API responds with a new access token
                    switchMap((token) => {
                      // issue a new non-refresh request using the new token
                      this.isRefreshing = false;
                      const retryRequest = req.clone({
                        headers: req.headers.append(
                          'Authorization',
                          'Bearer ' + token.token
                        ),
                      });
                      console.log("Trying request " + retryRequest.urlWithParams + " again with new token " + token.token);
                      return next.handle(retryRequest);
                    })
                  );
                } else {
                  console.log("We were refreshing and still got an error!")
                  this.authenticationService.logout("Login expired!", true)
                }
                break;
              case 403: //forbidden
                this.dialogService.displayErrorDialog(`403 - Forbidden: ${this.formatErrorMessage(error)}`);
                this.authenticationService.logout(undefined, true);
                break;
              default:
                this.dialogService.displayErrorDialog(
                  'Unknown error ' + error.status
                );
            }
          }
        } else {
          console.error('Not sure how we got here...');
        }
        return throwError(error);
      })
    );
  }
}
