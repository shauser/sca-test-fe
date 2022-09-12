import { Component, Input } from '@angular/core'
import { DocumentCommentsService } from 'src/app/services/rest/document-comments.service'
import { PaperlessDocumentComment } from 'src/app/data/paperless-document-comment'
import { FormControl, FormGroup } from '@angular/forms'
import { first } from 'rxjs/operators'
import { ToastService } from 'src/app/services/toast.service'

@Component({
  selector: 'app-document-comments',
  templateUrl: './document-comments.component.html',
  styleUrls: ['./document-comments.component.scss'],
})
export class DocumentCommentsComponent {
  commentForm: FormGroup = new FormGroup({
    newComment: new FormControl(''),
  })

  networkActive = false
  comments: PaperlessDocumentComment[] = []
  newCommentError: boolean = false

  private _documentId: number

  @Input()
  set documentId(id: number) {
    if (id != this._documentId) {
      this._documentId = id
      this.update()
    }
  }

  constructor(
    private commentsService: DocumentCommentsService,
    private toastService: ToastService
  ) {}

  update(): void {
    this.networkActive = true
    this.commentsService
      .getComments(this._documentId)
      .pipe(first())
      .subscribe((comments) => {
        this.comments = comments
        this.networkActive = false
      })
  }

  addComment() {
    const comment: string = this.commentForm
      .get('newComment')
      .value.toString()
      .trim()
    if (comment.length == 0) {
      this.newCommentError = true
      return
    }
    this.newCommentError = false
    this.networkActive = true
    this.commentsService.addComment(this._documentId, comment).subscribe({
      next: (result) => {
        this.comments = result
        this.commentForm.get('newComment').reset()
        this.networkActive = false
      },
      error: (e) => {
        this.networkActive = false
        this.toastService.showError(
          $localize`Error saving comment: ${e.toString()}`
        )
      },
    })
  }

  deleteComment(commentId: number) {
    this.commentsService.deleteComment(this._documentId, commentId).subscribe({
      next: (result) => {
        this.comments = result
        this.networkActive = false
      },
      error: (e) => {
        this.networkActive = false
        this.toastService.showError(
          $localize`Error deleting comment: ${e.toString()}`
        )
      },
    })
  }

  displayName(comment: PaperlessDocumentComment): string {
    if (!comment.user) return ''
    let nameComponents = []
    if (comment.user.firstname) nameComponents.unshift(comment.user.firstname)
    if (comment.user.lastname) nameComponents.unshift(comment.user.lastname)
    if (comment.user.username) {
      if (nameComponents.length > 0)
        nameComponents.push(`(${comment.user.username})`)
      else nameComponents.push(comment.user.username)
    }
    return nameComponents.join(' ')
  }
}
