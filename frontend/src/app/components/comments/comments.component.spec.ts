import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommentsComponent } from './comments.component';
import { CommentsService } from 'src/app/services/comments.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Comment } from 'src/app/models/comment.model';
import { MatDialogModule } from '@angular/material/dialog';

describe('CommentsComponent', () => {
	let component: CommentsComponent;
	let fixture: ComponentFixture<CommentsComponent>;
	let commentsService: CommentsService;
	let authenticationService: AuthenticationService;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [
				HttpClientTestingModule,
				MatProgressSpinnerModule,
				MatDialogModule
			],
			declarations: [CommentsComponent],
			providers: [
				{ provide: ActivatedRoute, useValue: { params: of({ plantId: 1, plantUsername: 'test' }) } },
				{ provide: Location, useValue: { back: jasmine.createSpy('back') } },
				CommentsService,
				AuthenticationService
			]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(CommentsComponent);
		component = fixture.componentInstance;
		commentsService = TestBed.inject(CommentsService);
		authenticationService = TestBed.inject(AuthenticationService);
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should get comments on init', () => {
		const comments = [
			new Comment(1, new Date(), 123, "comment", "username", "email", false),
			new Comment(2, new Date(), 345, "comment2", "username2", "email2", true)];
		spyOn(commentsService, 'getCommentsByPlantId').and.returnValue(of(comments));
		component.ngOnInit();
		expect(component.comments).toEqual(comments);
		expect(commentsService.getCommentsByPlantId).toHaveBeenCalledWith(1);
	});

	// Add more tests for deleteComment and addComment methods
});
