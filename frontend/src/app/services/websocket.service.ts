import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DialogService } from './dialog.service';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';


export enum MessageType {
  USER = 1, // from the user
  SYSTEM = 2, // from the client code
  SERVER = 3, // from the server code
  USER_JOIN = 4, // from the server code
  USER_LEAVE = 5, // from the server code
}
export interface Message {
  id: number
  content: string
  from: string
  timestamp: string
  channel: string
  type: MessageType
  token: string
  pmUsername: string
  authenticated: boolean
}

export interface User {
  username: string
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocketSubject<Message> | null = null
  public messages$: BehaviorSubject<Message | null> = new BehaviorSubject<Message | null>(null)
  public currentChannel: BehaviorSubject<string> = new BehaviorSubject<string>("")
  public isConnected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  private isCloseDueToClient: boolean = false

  constructor(private dialogService: DialogService, private authenticationService: AuthenticationService, private router: Router) {
  }

  public async joinChannel(channel: string): Promise<void> {
    if (this.socket) {
      this.leaveChannel()
    }
    this.isCloseDueToClient = false
    console.log("Joining channel after we get a fresh token...")
    var token = await this.authenticationService.getFreshToken()
    console.log("Okay, got a fresh token: " + token)
    var url = ""
    if (token) {
      url = `${environment.wsUrl}?channel=${channel}&token=Bearer ${token}`
    } else {
      this.dialogService.displayErrorDialog("Must login before we can join chat.");
      this.router.navigateByUrl('/authentication?mode=login');
      return
    }
    this.socket = webSocket<Message>({
      url: url,
      openObserver: {
        next: () => {
          console.log("connection ok");
          this.isConnected.next(true);
        },
      },
      closeObserver: {
        next: (closeEvent) => {
          console.log("CloseEvent: " + closeEvent.code + ": " + closeEvent.reason)
          // don't notify the user if they're the one initiating the close
          if (this.isCloseDueToClient) {
            return
          }
          this.dialogService.displayErrorDialog("Remote endpoint closed: " + closeEvent.reason)
          this.isConnected.next(false);
        }
      },
    })
    this.socket.subscribe((message: Message) => {
      console.log("Handle message " + message)
      this.messages$.next(message)
    });
    this.currentChannel.next(channel)
  }

  public leaveChannel(): void {
    console.log("Closing socket...")
    if (!this.socket) {
      return;
    }
    // this.socket.close(1000, "Voluntary disconnect")
    this.isCloseDueToClient = true
    this.socket.complete()
    this.socket = null;
    this.isConnected.next(false)
    this.currentChannel.next("")
  }

  public sendMessage(message: Message): void {
    // send an authenticated message
    if (this.authenticationService.isAuthenticated$.value) {
      message.token = "Bearer " + this.authenticationService.token
    }
    if (!this.socket) {
      this.dialogService.displayErrorDialog("Not connected. Join a channel first.")
      return
    }
    console.log("Sending message " + message.content)
    this.socket.next(message);
  }
}
