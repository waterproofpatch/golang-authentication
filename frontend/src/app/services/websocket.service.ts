import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { environment } from 'src/environments/environment';
import { DialogService } from './dialog.service';

export enum MessageType {
  USER = 1, // from the user
  SYSTEM = 2, // from the client code
  SERVER = 3, // from the server code
}
export interface Message {
  id: number
  content: string
  from: string
  timestamp: string
  channel: string
  type: MessageType
  token: string
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  public currentChannel: BehaviorSubject<string> = new BehaviorSubject<string>("")
  public isConnected: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  constructor(private dialogService: DialogService, private authenticationService: AuthenticationService) {
  }

  public joinChannel(channel: string, username: string): void {
    if (this.socket) {
      this.leaveChannel()
    }
    const url = `${environment.wsUrl}?channel=${channel}&username=${username}`
    this.socket = new WebSocket(url);
    this.socket.onerror = (event) => {
      // this.dialogService.displayErrorDialog("Error: " + event)
    };
    this.socket.onopen = (event) => {
      this.isConnected.next(true);
    }
    this.socket.onclose = (event) => {
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
      this.dialogService.displayErrorDialog("Not in a channel. Join a channel first.")
      return;
    }
    this.socket.close(1000, "Voluntary disconnect")
    this.socket = null;
    this.currentChannel.next("")
  }

  public sendMessage(message: Message): void {
    // send an authenticated message
    if (this.authenticationService.isAuthenticated && this.authenticationService.token) {
      message.token = this.authenticationService.token
    }
    if (!this.socket) {
      this.dialogService.displayErrorDialog("Not connected. Join a channel first.")
      return
    }
    this.socket.send(JSON.stringify(message));
  }

  getMessages(): Observable<string> {
    return new Observable<string>(observer => {
      if (this.socket) {
        this.socket.addEventListener('message', event => {
          observer.next(event.data);
        });
      } else {
        observer.error('WebSocket is not connected');
      }
    });
  }
}
