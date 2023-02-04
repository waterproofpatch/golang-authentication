import { Directive, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Directive({ selector: 'test' })
export class BaseComponent implements OnDestroy {
  private _subject: Subject<void> = new Subject<void>();

  protected get destroy$(): Observable<void> {
    return this._subject.asObservable();
  }

  public ngOnDestroy() {
    this._subject.next();
    this._subject.complete();
  }
}
