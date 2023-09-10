import { Component } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  version: string = "Loading..."
  constructor(public authenticationService: AuthenticationService, private profileService: ProfileService) {
  }

  ngOnInit(): void {
    this.getVersion()
  }

  getVersion(): void {

    this.profileService.getVersion().subscribe((x) => {
      this.version = x.version
    })
  }
}
