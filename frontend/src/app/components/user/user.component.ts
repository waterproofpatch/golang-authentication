import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { User } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent {
  @Input() user?: User
  constructor(private authenticationService: AuthenticationService) {

  }
  get username() {
    return this.authenticationService.username()
  }
}
