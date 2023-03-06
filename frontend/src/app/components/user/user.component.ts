import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { User } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent {
  @Input() user?: User
  @Input() username?: string

}
