import { TestBed } from '@angular/core/testing';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';

describe('BaseService', () => {
	let service: BaseService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(BaseService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('getUrlBase should return base URL', () => {
		expect(service.getUrlBase()).toEqual(environment.apiUrlBase);
	});
});
