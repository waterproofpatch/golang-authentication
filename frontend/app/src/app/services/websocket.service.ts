import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Message {
  content: string
  from: string
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket;

  constructor() {
    this.socket = new WebSocket(environment.wsUrl);
  }

  public sendMessage(message: Message): void {
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
