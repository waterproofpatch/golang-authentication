import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpsGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): boolean {
    if (location.protocol !== 'https:') {
      location.href = location.href.replace('http:', 'https:');
      return false;
    }
    return true;
  }
}
