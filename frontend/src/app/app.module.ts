import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- NgModel lives here


import { AuthenticationComponent } from './components/authentication/authentication.component';
import { AuthenticationService } from './services/authentication.service';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { LogDialogComponent } from './components/log-dialog/log-dialog.component';
import { ErrorDialogComponent } from './components/error-dialog/error-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BaseComponent } from './components/base/base.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlantComponent } from './components/item/plant.component';
import { ChatComponent } from './components/chat/chat.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MessageComponent } from './components/message/message.component';
import { UserComponent } from './components/user/user.component';


@NgModule({
  declarations: [
    AuthenticationComponent,
    LogDialogComponent,
    ErrorDialogComponent,
    AppComponent,
    BaseComponent,
    DashboardComponent,
    PlantComponent,
    ChatComponent,
    ProfileComponent,
    MessageComponent,
    UserComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    MatTabsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDatepickerModule,
    MatListModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    AuthenticationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true,
    },
    { provide: MatDialogRef, useValue: {} },

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
