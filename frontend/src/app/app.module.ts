import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- NgModel lives here

import { NgxLoadingButtonsModule } from 'ngx-loading-buttons';

import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthenticationService } from './services/authentication.service';
import { MatRadioModule } from '@angular/material/radio';
import { AuthInterceptorService } from './services/auth-interceptor.service';
import { LogDialogComponent } from './components/log-dialog/log-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
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
import { PlantsComponent } from './components/plants/plants.component';
import { PlantComponent } from './components/item/plant.component';
import { ChatComponent } from './components/chat/chat.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MessageComponent } from './components/message/message.component';
import { UserComponent } from './components/user/user.component';
import { CommentsComponent } from './components/comments/comments.component';
import { PlantCareDialogComponent } from './components/plant-care-dialog/plant-care-dialog.component';
import { NotesComponent } from './components/notes/notes.component';


@NgModule({
  declarations: [
    AuthenticationComponent,
    LogDialogComponent,
    ConfirmationDialogComponent,
    ErrorDialogComponent,
    AppComponent,
    BaseComponent,
    PlantsComponent,
    PlantComponent,
    ChatComponent,
    ProfileComponent,
    MessageComponent,
    UserComponent,
    CommentsComponent,
    PlantCareDialogComponent,
    NotesComponent
  ],
  imports: [
    NgxLoadingButtonsModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    BrowserModule,
    MatBadgeModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatExpansionModule,
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
    MatRadioModule,
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
