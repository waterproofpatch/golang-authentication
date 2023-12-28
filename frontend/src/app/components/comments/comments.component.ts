import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { CommentsService } from 'src/app/services/comments.service';
import { Comment } from 'src/app/models/comment.model';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent {

  commentContent: string = ""
  plantId: number = 0
  plantUsername: string = ""

  constructor(
    public commentsService: CommentsService,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    public authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.plantId = parseInt(params['plantId']);
      this.plantUsername = params['plantUsername'];
      this.commentsService.getCommentsByPlantId(this.plantId)
    });
  }

  public goBack(): void {
    this.location.back();
  }

  public deleteComment(comment: Comment) {
    this.commentsService.deleteCommentById(comment.ID)
  }

  public addComment() {
    const comment = Comment.makeComment(this.commentContent, this.plantId)
    this.commentContent = ""
    this.commentsService.addComment(comment)
  }
}
