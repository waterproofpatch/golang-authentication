import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { Message } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent {
  @Input() message?: Message


}
