import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
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

  intercept(req: any, next: any) {
    const authenticationService = this.injector.get(AuthenticationService);
    const authRequest = req.clone({
      headers: req.headers.append(
        'Authorization',
        'Bearer ' + authenticationService.token
      ),
    });

    return next.handle(authRequest).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          if (error.error instanceof ErrorEvent) {
            console.error('Error Event');
          } else {
            console.log(`error status : ${error.status} ${error.statusText}`);
            switch (error.status) {
              case 400:
                this.dialogService.displayErrorDialog(
                  'Bad request: ' + error.error.error_message
                );
                break;
              case 401: // login or token expired
                if (!this.isRefreshing) {
                  this.isRefreshing = true
                  return this.authenticationService.refresh().pipe(switchMap((token) => {
                    this.isRefreshing = false
                    this.authenticationService.setToken(token.token)
                    const authRequest2 = req.clone({
                      headers: req.headers.append(
                        'Authorization',
                        'Bearer ' + token.token
                      ),
                    });
                    console.log("Trying request again with new token " + token.token)
                    return next.handle(authRequest2)
                  }), catchError((err) => {
                    this.isRefreshing = false
                    this.authenticationService.logout()
                    this.dialogService.displayErrorDialog("Failed obtaining new access token. Must log back in again.")
                    console.log("Error on refresh: " + err)
                    return throwError(err)
                  }))
                }
                break;
              case 403: //forbidden
                this.dialogService.displayErrorDialog(
                  '403 - Forbidden: ' + error.error.error_message
                );
                this.authenticationService.logout();
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
