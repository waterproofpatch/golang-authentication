import { TestBed } from '@angular/core/testing';

import { HttpsguardService } from './httpsguard.service';

describe('HttpsguardService', () => {
  let service: HttpsguardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpsguardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
