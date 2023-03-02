import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Message, MessageType } from 'src/app/services/websocket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs';
import { DialogService } from 'src/app/services/dialog.service';
import { ActivatedRoute } from '@angular/router';

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

  constructor(private route: ActivatedRoute, private chatService: WebsocketService, private dialogService: DialogService) { }

  ngOnInit(): void {
    this.username = localStorage.getItem("username") || ""
    this.channel = localStorage.getItem("channel") || "public"
    console.log("init channel to " + this.channel)
    console.log("init username to " + this.username)
    this.subscribeToGetMessages()
    this.route.queryParams.subscribe((params) => {
      console.log("queryparams channel is " + params['channel'])
      if (params['channel'] != '' && params['channel'] != undefined) {
        this.channel = params['channel']
      }
    });
    if (this.channel != "" && this.username != "") {

      this.joinChannel()
    }
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

  isConnected(): Observable<boolean> {
    return this.chatService.isConnected
  }
  isDisconnected(): Observable<boolean> {
    return this.chatService.isConnected.pipe(map(isConnected => !isConnected))
  }

  joinChannel(): void {
    if (this.channel == "") {
      this.dialogService.displayErrorDialog("Invalid channel.")
      return;
    }
    localStorage.setItem("channel", this.channel)
    localStorage.setItem("username", this.username)
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
      from: 'changeme!',
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
