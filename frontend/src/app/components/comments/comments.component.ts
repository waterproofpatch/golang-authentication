import { Component } from '@angular/core';
import { CommentsService } from 'src/app/services/comments.service';
import Comment from 'src/app/services/comments.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent {

  comments: Comment[] = []
  constructor(private commentsService: CommentsService, private activatedRoute: ActivatedRoute) {

  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      const plantId = params['plantId'];
      this.commentsService.getComments(plantId)
    });
    this.commentsService.comments$.subscribe((x) => this.comments = x)
  }
}
