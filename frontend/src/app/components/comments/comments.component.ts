import { Component } from '@angular/core';
import { CommentsService, Comment } from 'src/app/services/comments.service';
// import Comment from 'src/app/services/comments.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { PlantsService } from 'src/app/services/plants.service';
import { Plant } from 'src/app/services/plants.service';

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
    private plantsService: PlantsService,
    private activatedRoute: ActivatedRoute,
    private location: Location,
    public authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.commentsService.isLoading$.subscribe((x) => this.isLoading = x)
    this.activatedRoute.params.subscribe(params => {
      this.plantId = parseInt(params['plantId']);
      this.updateCommentsForPlant()
    });
  }

  private updateCommentsForPlant(): void {
    this.isLoading = true;
    this.plantsService.getPlant(this.plantId).subscribe((plant: Plant) => {
      this.isLoading = false;
      console.log("Got " + plant.comments.length + " comments for plantId=" + plant.id)
      this.comments = plant.comments.sort((a: Comment, b: Comment) => {
        if (!b.CreatedAt || !a.CreatedAt) {
          return 0;
        }
        return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
      });
      this.comments.forEach((x) => {
        this.commentsService.viewComment(x)
      })
    })
  }

  public goBack(): void {
    this.location.back();
  }
  public deleteComment(comment: Comment) {
    this.commentsService.deleteComment(comment.id).subscribe((x) => {
      this.updateCommentsForPlant()
    })
  }
  public addComment() {
    const comment = CommentsService.CommentsFactory.makeComment(this.commentContent, this.plantId)
    this.commentsService.postComment(comment).subscribe((x) => {
      this.commentContent = ""
      this.updateCommentsForPlant()
    })
  }
}
