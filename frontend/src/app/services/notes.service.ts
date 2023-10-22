import { Injectable } from '@angular/core';

export interface Note {
  id: number;
  CreatedAt?: string;
  plantId: number;
  note: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  constructor() { }
}
