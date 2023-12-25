import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { CommentsComponent } from './components/comments/comments.component';
import { PlantsComponent } from './components/plants/plants.component';
import { ProfileComponent } from './components/profile/profile.component';
import { HttpsGuard } from './services/httpsguard.service';

const routes: Routes = [
  { path: 'authentication', canActivate: [HttpsGuard], component: AuthenticationComponent },
  { path: 'home', canActivate: [HttpsGuard], component: PlantsComponent },
  { path: 'profile', canActivate: [HttpsGuard], component: ProfileComponent },
  { path: 'comments/:plantId/:plantUsername', canActivate: [HttpsGuard], component: CommentsComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
