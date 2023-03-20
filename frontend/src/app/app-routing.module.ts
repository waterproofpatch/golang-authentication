import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { ChatComponent } from './components/chat/chat.component';
import { PlantsComponent } from './components/plants/plants.component';
import { ProfileComponent } from './components/profile/profile.component';

const routes: Routes = [
  { path: 'authentication', component: AuthenticationComponent },
  { path: 'home', component: PlantsComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
