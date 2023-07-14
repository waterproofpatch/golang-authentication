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
    this.activatedRoute.params.subscribe(params => {
      this.plantId = parseInt(params['plantId']);
      this.plantsService.getPlant(this.plantId).subscribe((plant: Plant) => {
        console.log("GOT PLANT FOR COMMENTS COMPONENT: " + plant.name + ", comments: " + plant.comments)
        this.comments = plant.comments
      })
      // this.commentsService.getComments(this.plantId)
    });
    this.commentsService.isLoading$.subscribe((x) => this.isLoading = x)
    // this.commentsService.comments$.subscribe((x) => {
    //   this.comments = x; for (let comment of x) {
    //     if (this.authenticationService.isAuthenticated$.value) {
    //       this.commentsService.viewComment(comment)
    //     }
    //   }
    // })
  }

  private updateCommentsForPlant(): void {
    this.plantsService.getPlant(this.plantId).subscribe((plant: Plant) => {
      console.log("GOT PLANT FOR COMMENTS COMPONENT: " + plant.name + ", comments: " + plant.comments)
      this.comments = plant.comments
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
