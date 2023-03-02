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
  public currentChannel: BehaviorSubject<string> = new BehaviorSubject<string>("public")

  constructor(private dialogService: DialogService, private authenticationService: AuthenticationService) {
    // this.socket = new WebSocket(environment.wsUrl + "/public");
  }

  public joinChannel(channel: string, username: string): void {
    if (this.socket) {
      this.leaveChannel()
    }
    const url = `${environment.wsUrl}/${channel}?username=${username}`
    console.log("URL: " + url)
    this.socket = new WebSocket(url);
    this.currentChannel.next(channel)
  }

  public leaveChannel(): void {
    console.log("Closing socket...")
    if (!this.socket) {
      this.dialogService.displayErrorDialog("Not in a channel.")
      return;
    }
    this.socket.close(1000, "Voluntary disconnect")
    this.socket = null;
  }

  public sendMessage(message: Message): void {
    // send an authenticated message
    if (this.authenticationService.isAuthenticated && this.authenticationService.token) {
      message.token = this.authenticationService.token
    }
    if (!this.socket) {
      this.dialogService.displayErrorDialog("Not connected.")
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
