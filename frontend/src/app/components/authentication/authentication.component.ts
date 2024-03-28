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
  resetCode: string = '';
  resetEmail: string = '';
  resetSuccessful: string = '';

  requestPasswordResetForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  passwordResetForm = new FormGroup({
    resetEmail: new FormControl('', [Validators.required]),
    resetCode: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    passwordConfirmation: new FormControl('', [Validators.required]),
  });
  registerForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });
  loginForm = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  error: string = '';

  constructor(
    private route: ActivatedRoute,
    public authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      // mode is "login" or "register" or "resetPassword"
      this.mode = params['mode'];
      this.verified = params['verified'];
      this.resetSuccessful = params['resetSuccessful'];
      this.requiresVerification = params['requiresVerification'];
      this.resetCode = params['resetCode'];
      this.resetEmail = params['resetEmail'];
      if (this.resetEmail != null) {
        // TODO consider making this invisible, like a user session value
        this.passwordResetForm.controls.resetEmail.setValue(this.resetEmail)
      }
      if (this.resetCode != null) {
        // TODO consider making this invisible, like a user session value
        this.passwordResetForm.controls.resetCode.setValue(this.resetCode)
      }
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
    if (this.passwordResetForm.controls.resetCode.hasError('required')) {
      return 'Not a valid reset code';
    }
    if (this.passwordResetForm.controls.password.hasError('required')) {
      return 'Not a valid password';
    }
    if (this.passwordResetForm.controls.passwordConfirmation.hasError('required')) {
      return 'Not a valid password';
    }
    if (this.passwordResetForm.controls.password.value != this.passwordResetForm.controls.passwordConfirmation.value) {
      return "Passwords do not match."
    }
    if (this.loginForm.controls.email.hasError('required')) {
      return 'You must enter a value';
    }
    if (this.requestPasswordResetForm.controls.email.hasError('required')) {
      return 'You must enter a value';
    }
    if (this.requestPasswordResetForm.controls.email.hasError('email')) {
      return 'Not a valid email';
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

  /**
   * ask the backend to begin a password reset workflow
   */
  public requestPasswordReset(): void {
    if (!this.requestPasswordResetForm.valid) {
      this.error = 'Fix validation errors.';
      return;
    }
    this.error = '';
    // TODO subscribe to the error once at construction, not each method
    this.authenticationService.error$.subscribe((error: string) => {
      if (error.length > 0) {
        this.error = error;
      } else {
        this.error = '';
      }
    });
    if (this.requestPasswordResetForm.controls.email.value != null) {
      this.authenticationService.requestPasswordReset(this.requestPasswordResetForm.controls.email.value)
    }
  }

  /**
   * when a user has filled out the password reset form, submit this request to backend
   * @returns 
   */
  public performPasswordReset(): void {
    if (!this.passwordResetForm.valid) {
      this.error = 'Fix validation errors.';
      return;
    }
    this.error = '';
    // TODO subscribe to the error once at construction, not each method
    this.authenticationService.error$.subscribe((error: string) => {
      if (error.length > 0) {
        this.error = error;
      } else {
        this.error = '';
      }
    });
    if (this.passwordResetForm.controls.password.value == null ||
      this.passwordResetForm.controls.resetEmail.value == null ||
      this.passwordResetForm.controls.passwordConfirmation.value == null ||
      this.passwordResetForm.controls.resetCode.value == null
    ) {
      return;
    }
    this.authenticationService.performPasswordReset(
      this.passwordResetForm.controls.resetEmail.value,
      this.passwordResetForm.controls.resetCode.value,
      this.passwordResetForm.controls.password.value,
      this.passwordResetForm.controls.passwordConfirmation.value,
    );
  }
}
