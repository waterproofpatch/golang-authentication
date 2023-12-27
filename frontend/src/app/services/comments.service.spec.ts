import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommentsService } from './comments.service';
import { Comment } from '../models/comment.model';

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

	afterEach(() => {
		httpMock.verify(); // Ensure that there are no outstanding requests
	});

	it('should fetch comments by plant id', () => {
		const mockComments: Comment[] = [Comment.makeComment('Test comment', 1)];

		service.getCommentsByPlantId(1);

		const req = httpMock.expectOne(service.getUrlBase() + service.commentsApiUrl + "?plantId=1");
		expect(req.request.method).toBe('GET');
		req.flush(mockComments);

		service.comments$.subscribe(comments => {
			expect(comments.length).toBe(1);
			expect(comments).toEqual(mockComments);
		});
	});

	it('should delete a comment by id', () => {
		service.deleteCommentById(1);

		const req = httpMock.expectOne(service.getUrlBase() + service.commentsApiUrl + "/1");
		expect(req.request.method).toBe('DELETE');
		req.flush([]);

		// Add additional expectations if needed
	});

	it('should add a comment', () => {
		const newComment: Comment[] = [Comment.makeComment('New comment', 1)];

		service.addComment(newComment[0]);

		const req = httpMock.expectOne(service.getUrlBase() + service.commentsApiUrl + "/" + newComment[0].id);
		expect(req.request.method).toBe('POST');
		req.flush(newComment);

		// Add additional expectations if needed
	});
});
