import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket;
  private readonly url: string = 'ws://localhost:5000/ws';

  constructor() {
    this.socket = new WebSocket(this.url);
  }

  public sendMessage(message: string): void {
    this.socket.send(message);
  }

  public getMessages(): Observable<string> {
    return new Observable<string>(observer => {
      this.socket.addEventListener('message', event => {
        observer.next(event.data);
      });
    });
  }
}
