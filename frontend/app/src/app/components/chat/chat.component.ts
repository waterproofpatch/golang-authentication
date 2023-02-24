import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Message } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  title = '';
  name: string = 'John Doe'
  message: string = '';
  messages: string[] = [];

  constructor(private chatService: WebsocketService) { }

  ngOnInit(): void {
    this.chatService.getMessages().subscribe(message => {
      this.messages.push(message);
    });
  }

  sendMessage(): void {

    const message: Message = {

      from: this.name,
      content: this.message,
    };
    this.chatService.sendMessage(message);
    this.message = '';
  }
}
