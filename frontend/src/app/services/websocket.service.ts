import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DialogService } from './dialog.service';

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
  private socket: WebSocket | null = null;
  public currentChannel: BehaviorSubject<string> = new BehaviorSubject<string>("")
  public isConnected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  constructor(private dialogService: DialogService, private authenticationService: AuthenticationService, private router: Router) {
  }

  public async joinChannel(channel: string): Promise<void> {
    if (this.socket) {
      this.leaveChannel()
    }
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
    this.socket = new WebSocket(url);
    this.socket.onerror = (event) => {
      // this.dialogService.displayErrorDialog("Error: " + event)
      console.log(`Error in websocket: ${event}`)
      this.isConnected.next(false);
    };
    this.socket.onopen = (event) => {
      console.log("onopen!")
      this.isConnected.next(true);
    }
    this.socket.onclose = (event) => {
      console.log("onclose!")
      this.isConnected.next(false);
      // 1000 is normal closure; e.g. triggered by the frontend client
      if (event.code != 1000) {
        this.dialogService.displayErrorDialog('WebSocket closed:' + event.code + ', ' + event.reason)
      }
    };
    this.currentChannel.next(channel)
  }

  public leaveChannel(): void {
    console.log("Closing socket...")
    if (!this.socket) {
      return;
    }
    this.socket.close(1000, "Voluntary disconnect")
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
    this.socket.send(JSON.stringify(message));
  }

  getMessages(): Observable<string> {
    return new Observable<string>(observer => {
      if (this.socket) {
        this.socket.addEventListener('message', event => {
          observer.next(event.data);
        });
      } else {
        this.isConnected.next(false)
        observer.error('WebSocket is not connected');
      }
    });
  }
}
