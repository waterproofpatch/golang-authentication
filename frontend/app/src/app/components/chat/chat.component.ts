import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  title = '';
  message: string = '';
  messages: string[] = [];

  constructor(private chatService: WebsocketService) { }

  ngOnInit(): void {
    this.chatService.getMessages().subscribe(message => {
      this.messages.push(message);
    });
  }

  sendMessage(): void {
    this.chatService.sendMessage(this.message);
    this.message = '';
  }
}
