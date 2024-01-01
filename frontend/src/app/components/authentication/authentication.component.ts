import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.css'],
})
export class AuthenticationComponent implements OnInit {
  mode: string = '';
  verified: string = '';
  requiresVerification: string = '';
  hide = true;
  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl(''),
  });
  loginForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl(''),
  });

  error: string = '';

  constructor(
    private route: ActivatedRoute,
    public authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      // mode is "login" or "register"
      this.mode = params['mode'];
      this.verified = params['verified'];
      this.requiresVerification = params['requiresVerification'];
      // user navigated away from a page that may have contained an error
      this.error = ""
    });
    this.authenticationService.error$.subscribe((error: string) => {
      if (error.length > 0) {
        this.error = error;
      } else {
        this.error = '';
      }
    });
  }

  /**
   * called from the UI when the user clicks the register button
   * @returns 
   */
  public register(): void {
    if (!this.registerForm.valid) {
      this.error = 'Fix validation errors.';
      return;
    }
    this.error = '';
    this.authenticationService.error$.subscribe((error: string) => {
      if (error.length > 0) {
        this.error = error;
      } else {
        this.error = '';
      }
    });
    if (this.registerForm.controls.email.value == null || this.registerForm.controls.password.value == null || this.registerForm.controls.username.value == null) {
      return;
    }
    this.authenticationService.register(
      this.registerForm.controls.email.value,
      this.registerForm.controls.username.value,
      this.registerForm.controls.password.value,
    );
  }

  /**
   * called from the UI when the user clicks the login button
   * @returns 
   */
  public login(resendCode?: boolean) {
    this.error = '';
    if (this.loginForm.controls.email.value == null) {
      console.log("Email is NULL")
      return;
    }
    if (this.loginForm.controls.password.value == null) {
      console.log("Password is NULL")
      return;
    }
    this.authenticationService.login(
      this.loginForm.controls.email.value,
      this.loginForm.controls.password.value,
      resendCode
    );
  }

  /**
   * called from the UI via the forms error handling code to display errors 
   * to the user
   * @returns string error representation
   */
  public getErrorMessage(): string {
    if (this.loginForm.controls.email.hasError('required')) {
      return 'You must enter a value';
    }
    if (this.registerForm.controls.email.hasError('required')) {
      return 'You must enter a value';
    }
    if (this.registerForm.controls.email.hasError('email')) {
      return 'Not a valid email';
    }
    return this.loginForm.controls.email.hasError('email')
      ? 'Not a valid email'
      : '';
  }
}
