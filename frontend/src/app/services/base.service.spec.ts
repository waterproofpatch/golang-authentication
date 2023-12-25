import { HttpHeaders } from '@angular/common/http';
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
	it('httpOptions should be defined correctly', () => {
		const expectedHttpOptions = {
			withCredentials: true,
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			}),
		};

		expect(service.httpOptions.withCredentials).toEqual(expectedHttpOptions.withCredentials);
		expect(service.httpOptions.headers.get('Content-Type')).toEqual(expectedHttpOptions.headers.get('Content-Type'));
		expect(service.httpOptions.headers.get('Access-Control-Allow-Origin')).toEqual(expectedHttpOptions.headers.get('Access-Control-Allow-Origin'));
	});
	it('httpOptionsNonJson should be defined correctly', () => {
		const expectedHttpOptionsNonJson = {
			withCredentials: true,
			headers: new HttpHeaders({
				'Access-Control-Allow-Origin': '*',
			}),
		};

		expect(service.httpOptionsNonJson.headers.get('Access-Control-Allow-Origin')).toEqual(expectedHttpOptionsNonJson.headers.get('Access-Control-Allow-Origin'));
	});
	it('httpOptions should only have two headers', () => {
		const expectedHeaders = ['Content-Type', 'Access-Control-Allow-Origin'];

		const actualHeaders = service.httpOptions.headers.keys();
		expect(actualHeaders.length).toEqual(expectedHeaders.length);

		expectedHeaders.forEach(header => {
			expect(actualHeaders).toContain(header);
		});
	});
	it('isLoading$ should be defined and emit false initially', (done: DoneFn) => {
		service.isLoading$.subscribe(value => {
			expect(value).toBeFalse();
			done();
		});
	});
	it('isLoading$ should emit true when set to true', (done: DoneFn) => {
		service.isLoading$.next(true);

		service.isLoading$.subscribe(value => {
			expect(value).toBeTrue();
			done();
		});
	});


});
