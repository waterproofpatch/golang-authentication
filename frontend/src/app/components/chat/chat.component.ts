import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { WebsocketService } from 'src/app/services/websocket.service';
import { AfterViewInit } from '@angular/core';
import { Message, MessageType, User } from 'src/app/services/websocket.service';
import { BehaviorSubject, Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs';
import { DialogService } from 'src/app/services/dialog.service';
import { ActivatedRoute } from '@angular/router';
import { ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('scrollMe') private scrollContainer: ElementRef | undefined;
  channel: string = '';
  message: string = '';
  pmUsername: string = '';
  selectedUsernames: string[] = [];
  messages: Message[] = [];
  users: User[] = [];

  constructor(private route: ActivatedRoute, private chatService: WebsocketService, private dialogService: DialogService, public authenticationService: AuthenticationService, private router: Router) { }

  ngOnInit(): void {
    if (!this.authenticationService.isAuthenticated$.value) {
      this.router.navigateByUrl('/authentication?mode=login');
      return
    }
    this.channel = sessionStorage.getItem("channel") || "public"
    this.route.queryParams.subscribe((params) => {
      if (params['channel'] != '' && params['channel'] != undefined) {
        this.channel = params['channel']
      }
    });

    // listen for notifications of connection
    this.chatService.isConnected.subscribe((isConnected: boolean) => {
      // handle a disconnect
      if (!isConnected) {
        this.users = []
        this.messages = []
        this.selectedUsernames = []
      }
    })

    // if we detect a logout, leave the channel
    this.authenticationService.isAuthenticated$.subscribe((x) => {
      if (!x) {
        console.log("No longer authenticated, leaving channel!")
        this.leaveChannel();
        this.router.navigateByUrl('/authentication?mode=login');
        setTimeout(() => this.router.navigateByUrl('/authentication?mode=login'), 0)
      }
    })

    // this.subscribeToGetMessages()

    // if we've got a channel to join, do so right away
    if (this.channel != "") {
      this.joinChannel()
    }
  }
  ngAfterViewInit() {
    this.scrollToBottom();
  }

  // scroll to latest message
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

  get username() {
    return this.authenticationService.username()
  }
  // add a new tab for PMing another user
  pmUser(username: string) {
    // don't add self to tab list
    if (username == this.authenticationService.username()) {
      console.log("User is you!")
      return;
    }
    const existingUsername = this.selectedUsernames.find(name => name === username);
    // don't double add tabs
    if (existingUsername != undefined) {
      return;
    }
    this.selectedUsernames.push(username)
  }

  removeTab(tabUsername: any) {
    // event.stopPropagation();
    this.selectedUsernames = this.selectedUsernames.filter(name => name != tabUsername);
    if (this.pmUsername === tabUsername) {
      this.pmUsername = '';
    }
  }

  // when someone clicks a tab, set the current pm username
  pmUserSelect(event: any) {
    this.pmUsername = event['tab']['textLabel']

    // if we're back to our channel, its not a pm
    if (this.pmUsername == this.channel) {
      this.pmUsername = '';
    }
    console.log("PMing " + this.pmUsername)
  }

  // called at the beginning to get messages from socket
  subscribeToGetMessages() {
    this.chatService.getMessages().pipe(
      catchError((error: any) => {
        console.log("Catching error in chatService.getMessages: " + error)
        return throwError(error)
      }),
      map((message: string) => {
        console.log("Mapping message to JSON...")
        return JSON.parse(message)
      })
    ).subscribe((message: Message) => {
      // handle the server telling us that a user has joined
      if (message.type == MessageType.USER_JOIN) {
        console.log("Handling USER_JOIN message...")
        let user = { username: message.content }
        this.users.push(user)
        return;
      }
      // handle the server telling us that a user has left
      if (message.type == MessageType.USER_LEAVE) {
        console.log("Handling USER_LEAVE message...")
        this.users = this.users.filter(obj => { return obj.username !== message.content });
        return;
      }
      console.log("Handling general chat message message...")
      // if we make it this far, it's assumed that it's a general chat message
      this.messages.push(message);

      // handle another user sending us a PM by opening a tab
      if (message.pmUsername != '') {
        console.log("Received a pm from " + message.from)
        this.pmUser(message.from)
      }

      // update the view so the most recent message is at the bottom
      this.scrollToBottom()
    });
  }

  // whether or not the socket is connected
  isConnected(): Observable<boolean> {
    return this.chatService.isConnected || this.authenticationService.isAuthenticated$
  }

  // whether or not the socket is connected
  isDisconnected(): Observable<boolean> {
    return this.chatService.isConnected.pipe(map(isConnected => !isConnected))
  }

  // join a different channel
  async joinChannel(): Promise<void> {
    if (this.channel == "") {
      this.dialogService.displayErrorDialog("Invalid channel.")
      return;
    }
    sessionStorage.setItem("channel", this.channel)
    await this.chatService.joinChannel(this.channel)

    // we need to subscribe after a socket is set up.
    this.subscribeToGetMessages()
  }

  // leave the current channel
  leaveChannel(): void {
    this.chatService.leaveChannel()
    this.users = []
  }

  // what channel we're currently connected to
  getCurrentChannel(): BehaviorSubject<string> {
    return this.chatService.currentChannel
  }

  // send a message to the server
  sendMessage(): void {
    const message: Message = {
      pmUsername: this.pmUsername,
      id: 0,
      from: "",
      content: this.message,
      timestamp: "",
      type: MessageType.USER,
      channel: this.getCurrentChannel().getValue(),
      token: "",
      authenticated: false, // filled by server before broadcasting to clients
    };
    this.chatService.sendMessage(message);
    this.message = '';
  }
}
