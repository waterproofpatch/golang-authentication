import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Message, MessageType } from 'src/app/services/websocket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  title = '';
  channel: string = '';
  message: string = '';
  username: string = '';
  messages: Message[] = [];

  constructor(private chatService: WebsocketService) { }

  ngOnInit(): void {
    this.initUsername()
    this.subscribeToGetMessages()
  }

  subscribeToGetMessages() {
    this.chatService.getMessages().pipe(
      map((message: any) => {
        let message_json: Message = JSON.parse(message)
        return { from: message_json.from, content: message_json.content, timestamp: message_json.timestamp, type: message_json.type, channel: message_json.channel, token: message_json.token };
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

  joinChannel(): void {
    this.chatService.joinChannel(this.channel, this.username)
    this.subscribeToGetMessages()
    const now = new Date(); // creates a new Date object with the current date and time
    const estOptions = { timeZone: 'America/New_York', hour12: true };
    const estTimeString = now.toLocaleTimeString('en-US', estOptions);
    this.messages.push({ content: "Joined channel [" + this.getCurrentChannel().getValue() + "]", timestamp: estTimeString, from: "<System>", type: MessageType.SYSTEM, channel: this.getCurrentChannel().getValue(), token: "TBD" })
  }

  leaveChannel(): void {
    this.chatService.leaveChannel()
    const now = new Date(); // creates a new Date object with the current date and time
    const estOptions = { timeZone: 'America/New_York', hour12: true };
    const estTimeString = now.toLocaleTimeString('en-US', estOptions);
    this.messages.push({ content: "Left channel.", timestamp: estTimeString, from: "<System>", type: MessageType.SYSTEM, channel: this.getCurrentChannel().getValue(), token: "TBD" })
  }

  getCurrentChannel(): BehaviorSubject<string> {
    return this.chatService.currentChannel
  }

  sendMessage(): void {
    const message: Message = {
      from: this.username,
      content: this.message,
      timestamp: "",
      type: MessageType.USER,
      channel: this.getCurrentChannel().getValue(),
      token: "TBD",
    };
    this.chatService.sendMessage(message);
    this.message = '';
  }
}
