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
  private socket: WebSocket;
  public currentChannel: BehaviorSubject<string> = new BehaviorSubject<string>("public")

  constructor(private dialogService: DialogService, private authenticationService: AuthenticationService) {
    this.socket = new WebSocket(environment.wsUrl + "/public");
  }

  public joinChannel(channel: string): void {
    this.leaveChannel()
    this.socket = new WebSocket(environment.wsUrl + "/" + channel);
    this.currentChannel.next(channel)
  }

  public leaveChannel(): void {
    console.log("Closing socket...")
    this.socket.close(1000, "Voluntary disconnect")
  }

  public sendMessage(message: Message): void {
    // send an authenticated message
    if (this.authenticationService.isAuthenticated && this.authenticationService.token) {
      message.token = this.authenticationService.token
    }
    this.socket.send(JSON.stringify(message));
  }

  public getMessages(): Observable<string> {
    return new Observable<string>(observer => {
      this.socket.addEventListener('message', event => {
        observer.next(event.data);
      });
    });
  }
}
