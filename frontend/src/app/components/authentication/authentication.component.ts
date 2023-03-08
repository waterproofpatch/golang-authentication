import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Observable } from 'rxjs';

import { IRegistrationState } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.css'],
})
export class AuthenticationComponent implements OnInit {
  mode: string = '';
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
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.authenticationService.resetRegistrationState();
      this.mode = params['mode'];
    });
  }

  public get RegistrationState(): typeof IRegistrationState {
    return IRegistrationState;
  }

  getRegistrationState(): Observable<IRegistrationState> {
    return this.authenticationService.registrationState$;
  }

  register(): void {
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
  login() {
    this.error = '';
    this.authenticationService.error$.subscribe((error: string) => {
      if (error.length > 0) {
        this.error = error;
      } else {
        this.error = '';
      }
    });
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
      this.loginForm.controls.password.value
    );
  }
  getErrorMessage() {
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
