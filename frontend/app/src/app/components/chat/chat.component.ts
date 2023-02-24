import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Message } from 'src/app/services/websocket.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  title = '';
  message: string = '';
  username: string = 'John Doe';
  messages: Message[] = [];

  constructor(private chatService: WebsocketService) { }

  ngOnInit(): void {
    this.initUsername()
    this.chatService.getMessages().pipe(
      map((message: any) => {
        let message_json: Message = JSON.parse(message)
        return { from: message_json.from, content: message_json.content };
      })
    ).subscribe((message: Message) => {
      this.messages.push(message);
    });
  }

  initUsername() {
    const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Isabella', 'Mason', 'Sophia', 'Logan'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    function generateUsername(): string {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${firstName} ${lastName}`;
    }

    // Example usage:
    this.username = generateUsername();
  }

  sendMessage(): void {

    const message: Message = {

      from: this.username,
      content: this.message,
    };
    this.chatService.sendMessage(message);
    this.message = '';
  }
}
