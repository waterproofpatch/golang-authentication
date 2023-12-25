import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { PlantsService } from 'src/app/services/plants.service';
import { CommentsService } from 'src/app/services/comments.service';
import { Comment } from 'src/app/models/comment.model';
import { Plant } from 'src/app/models/plant.model';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent {

  comments: Comment[] = []
  commentContent: string = ""
  plantId: number = 0

  constructor(
    public commentsService: CommentsService,
    private plantsService: PlantsService,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    public authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.plantId = parseInt(params['plantId']);
      this.updateCommentsForPlant()
    });
  }

  private updateCommentsForPlant(): void {
    this.plantsService.getPlantById(this.plantId).subscribe((plant: Plant) => {
      console.log("Got " + plant.comments.length + " comments for plantId=" + plant.id)
      this.comments = plant.comments.sort((a: Comment, b: Comment) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      if (this.authenticationService.isAuthenticated$.value) {
        this.comments.forEach((x) => {
          this.commentsService.viewComment(x)
        })
      }
    })
  }

  public goBack(): void {
    this.location.back();
  }
  public deleteComment(comment: Comment) {
    this.commentsService.deleteCommentById(comment.id).subscribe((x) => {
      this.updateCommentsForPlant()
    })
  }
  public addComment() {
    const comment = Comment.makeComment(this.commentContent, this.plantId)
    this.commentsService.postComment(comment).subscribe((x) => {
      this.commentContent = ""
      this.updateCommentsForPlant()
    })
  }
}
