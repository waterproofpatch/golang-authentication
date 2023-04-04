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

  isLoading: boolean = false
  comments: Comment[] = []
  commentContent: string = ""
  plantId: number = 0

  constructor(
    private commentsService: CommentsService,
    private activatedRoute: ActivatedRoute) {

  }
  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.plantId = parseInt(params['plantId']);
      this.commentsService.getComments(this.plantId)
    });
    this.commentsService.isLoading$.subscribe((x) => this.isLoading = x)
    this.commentsService.comments$.subscribe((x) => this.comments = x)
  }

  public deleteComment(comment: Comment) {
    this.commentsService.deleteComment(comment)
  }
  public addComment() {
    const comment = CommentsService.CommentsFactory.makeComment(this.commentContent, this.plantId)
    this.commentsService.postComment(comment)
    this.commentContent = ""
  }
}
