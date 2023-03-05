import { Component } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';
import { AfterViewInit } from '@angular/core';
import { Message, MessageType, User } from 'src/app/services/websocket.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs';
import { DialogService } from 'src/app/services/dialog.service';
import { ActivatedRoute } from '@angular/router';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('scrollMe') private scrollContainer: ElementRef | undefined;
  channel: string = '';
  message: string = '';
  username: string = '';
  messages: Message[] = [];
  users: User[] = [];

  constructor(private route: ActivatedRoute, private chatService: WebsocketService, private dialogService: DialogService) { }

  ngOnInit(): void {
    this.username = localStorage.getItem("username") || ""
    this.channel = localStorage.getItem("channel") || "public"
    this.subscribeToGetMessages()
    this.route.queryParams.subscribe((params) => {
      if (params['channel'] != '' && params['channel'] != undefined) {
        this.channel = params['channel']
      }
    });
    if (this.channel != "" && this.username != "") {

      this.joinChannel()
    }
  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }
  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.scrollContainer == undefined) {
          return;
        }
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }, 50);
    } catch (err) { }
  }

  subscribeToGetMessages() {
    this.chatService.getMessages().pipe(
      map((message: string) => {
        return JSON.parse(message)
      })
    ).subscribe((message: Message) => {
      if (message.type == MessageType.USER_JOIN) {
        let user = { username: message.content }
        this.users.push(user)
        return;
      }
      if (message.type == MessageType.USER_LEAVE) {
        this.users = this.users.filter(obj => { return obj.username !== message.content });
        return;
      }
      this.messages.push(message);
      this.scrollToBottom()
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
  }

  leaveChannel(): void {
    this.chatService.leaveChannel()
    this.users = []
  }

  getCurrentChannel(): BehaviorSubject<string> {
    return this.chatService.currentChannel
  }

  sendMessage(): void {
    const message: Message = {
      id: 0,
      from: '',
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
