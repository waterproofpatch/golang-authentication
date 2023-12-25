import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommentsService } from './comments.service';
import { Comment } from '../types';

describe('CommentsService', () => {
	let service: CommentsService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [CommentsService]
		});

		service = TestBed.inject(CommentsService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should post a comment', () => {
		const dummyComment: Comment = {
			content: 'test content',
			plantId: 1,
			username: 'test user',
			email: 'test email',
			id: 1,
			CreatedAt: 'test date',
			viewed: false,
		};

		service.postComment(dummyComment).subscribe(comment => {
			expect(comment).toEqual(dummyComment);
		});

		const req = httpMock.expectOne(`${service.getUrlBase()}${service.commentsApiUrl}/${dummyComment.id}`);
		expect(req.request.method).toBe('POST');
		req.flush(dummyComment);
	});

	it('should delete a comment', () => {
		const dummyId = 1;

		service.deleteComment(dummyId).subscribe(res => {
			expect(res).toEqual({});
		});

		const req = httpMock.expectOne(`${service.getUrlBase()}${service.commentsApiUrl}/${dummyId}`);
		expect(req.request.method).toBe('DELETE');
		req.flush({});
	});

	afterEach(() => {
		httpMock.verify();
	});
});
