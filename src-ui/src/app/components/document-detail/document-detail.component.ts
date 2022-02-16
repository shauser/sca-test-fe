import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbNav } from '@ng-bootstrap/ng-bootstrap';
import { PaperlessCorrespondent } from 'src/app/data/paperless-correspondent';
import { PaperlessDocument } from 'src/app/data/paperless-document';
import { PaperlessDocumentMetadata } from 'src/app/data/paperless-document-metadata';
import { PaperlessDocumentType } from 'src/app/data/paperless-document-type';
import { DocumentTitlePipe } from 'src/app/pipes/document-title.pipe';
import { DocumentListViewService } from 'src/app/services/document-list-view.service';
import { OpenDocumentsService } from 'src/app/services/open-documents.service';
import { CorrespondentService } from 'src/app/services/rest/correspondent.service';
import { DocumentTypeService } from 'src/app/services/rest/document-type.service';
import { DocumentService } from 'src/app/services/rest/document.service';
import { ConfirmDialogComponent } from '../common/confirm-dialog/confirm-dialog.component';
import { CorrespondentEditDialogComponent } from '../manage/correspondent-list/correspondent-edit-dialog/correspondent-edit-dialog.component';
import { DocumentTypeEditDialogComponent } from '../manage/document-type-list/document-type-edit-dialog/document-type-edit-dialog.component';
import { PDFDocumentProxy } from 'ng2-pdf-viewer';
import { ToastService } from 'src/app/services/toast.service';
import { TextComponent } from '../common/input/text/text.component';
import { SettingsService, SETTINGS_KEYS } from 'src/app/services/settings.service';
import { dirtyCheck, DirtyComponent } from '@ngneat/dirty-check-forms';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { PaperlessDocumentSuggestions } from 'src/app/data/paperless-document-suggestions';
import { FILTER_FULLTEXT_MORELIKE } from 'src/app/data/filter-rule-type';

@Component({
  selector: 'app-document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss']
})
export class DocumentDetailComponent implements OnInit, OnDestroy, DirtyComponent {

  @ViewChild("inputTitle")
  titleInput: TextComponent

  expandOriginalMetadata = false
  expandArchivedMetadata = false

  error: any

  networkActive = false

  documentId: number
  document: PaperlessDocument
  metadata: PaperlessDocumentMetadata
  suggestions: PaperlessDocumentSuggestions

  title: string
  previewUrl: string
  downloadUrl: string
  downloadOriginalUrl: string

  correspondents: PaperlessCorrespondent[]
  documentTypes: PaperlessDocumentType[]

  documentForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    content: new FormControl(''),
    created: new FormControl(),
    correspondent: new FormControl(),
    document_type: new FormControl(),
    archive_serial_number: new FormControl(),
    tags: new FormControl([])
  })

  previewCurrentPage: number = 1
  previewNumPages: number = 1

  store: BehaviorSubject<any>
  isDirty$: Observable<boolean>
  unsubscribeNotifier: Subject<any> = new Subject()

  @ViewChild('nav') nav: NgbNav
  @ViewChild('pdfPreview') set pdfPreview(element) {
    // this gets called when compontent added or removed from DOM
    if (element && element.nativeElement.offsetParent !== null) { // its visible

      setTimeout(()=> this.nav?.select(1));
    }
  }

  constructor(
    private documentsService: DocumentService,
    private route: ActivatedRoute,
    private correspondentService: CorrespondentService,
    private documentTypeService: DocumentTypeService,
    private router: Router,
    private modalService: NgbModal,
    private openDocumentService: OpenDocumentsService,
    private documentListViewService: DocumentListViewService,
    private documentTitlePipe: DocumentTitlePipe,
    private toastService: ToastService,
    private settings: SettingsService) { }

  get useNativePdfViewer(): boolean {
    return this.settings.get(SETTINGS_KEYS.USE_NATIVE_PDF_VIEWER)
  }

  getContentType() {
    return this.metadata?.has_archive_version ? 'application/pdf' : this.metadata?.original_mime_type
  }

  ngOnInit(): void {
    this.documentForm.valueChanges.pipe(takeUntil(this.unsubscribeNotifier)).subscribe(wow => {
      Object.assign(this.document, this.documentForm.value)
    })

    this.correspondentService.listAll().pipe(first()).subscribe(result => this.correspondents = result.results)
    this.documentTypeService.listAll().pipe(first()).subscribe(result => this.documentTypes = result.results)

    this.route.paramMap.pipe(takeUntil(this.unsubscribeNotifier)).subscribe(paramMap => {
      this.documentId = +paramMap.get('id')
      this.previewUrl = this.documentsService.getPreviewUrl(this.documentId)
      this.downloadUrl = this.documentsService.getDownloadUrl(this.documentId)
      this.downloadOriginalUrl = this.documentsService.getDownloadUrl(this.documentId, true)
      this.suggestions = null
      if (this.openDocumentService.getOpenDocument(this.documentId)) {
        this.updateComponent(this.openDocumentService.getOpenDocument(this.documentId))
      }
      this.documentsService.get(this.documentId).pipe(first()).subscribe(doc => {
        // Initialize dirtyCheck
        this.store = new BehaviorSubject({
          title: doc.title,
          content: doc.content,
          created: doc.created,
          correspondent: doc.correspondent,
          document_type: doc.document_type,
          archive_serial_number: doc.archive_serial_number,
          tags: doc.tags
        })

        this.isDirty$ = dirtyCheck(this.documentForm, this.store.asObservable())
        this.isDirty$.pipe(takeUntil(this.unsubscribeNotifier)).subscribe(dirty => {
          this.openDocumentService.setDirty(this.documentId, dirty)
        })

        if (!this.openDocumentService.getOpenDocument(this.documentId)) {
          this.openDocumentService.openDocument(doc)
          this.updateComponent(doc)
        }
      }, error => {this.router.navigate(['404'])})
    })

  }

  ngOnDestroy() : void {
    this.unsubscribeNotifier.next();
    this.unsubscribeNotifier.complete();
  }

  updateComponent(doc: PaperlessDocument) {
    this.document = doc
    this.documentsService.getMetadata(doc.id).pipe(first()).subscribe(result => {
      this.metadata = result
    }, error => {
      this.metadata = null
    })
    this.documentsService.getSuggestions(doc.id).pipe(first()).subscribe(result => {
      this.suggestions = result
    }, error => {
      this.suggestions = null
    })
    this.title = this.documentTitlePipe.transform(doc.title)
    this.documentForm.patchValue(doc)
  }

  createDocumentType(newName: string) {
    var modal = this.modalService.open(DocumentTypeEditDialogComponent, {backdrop: 'static'})
    modal.componentInstance.dialogMode = 'create'
    if (newName) modal.componentInstance.object = { name: newName }
    modal.componentInstance.success.pipe(first()).subscribe(newDocumentType => {
      this.documentTypeService.listAll().pipe(first()).subscribe(documentTypes => {
        this.documentTypes = documentTypes.results
        this.documentForm.get('document_type').setValue(newDocumentType.id)
      })
    })
  }

  createCorrespondent(newName: string) {
    var modal = this.modalService.open(CorrespondentEditDialogComponent, {backdrop: 'static'})
    modal.componentInstance.dialogMode = 'create'
    if (newName) modal.componentInstance.object = { name: newName }
    modal.componentInstance.success.pipe(first()).subscribe(newCorrespondent => {
      this.correspondentService.listAll().pipe(first()).subscribe(correspondents => {
        this.correspondents = correspondents.results
        this.documentForm.get('correspondent').setValue(newCorrespondent.id)
      })
    })
  }

  discard() {
    this.documentsService.get(this.documentId).pipe(first()).subscribe(doc => {
      Object.assign(this.document, doc)
      this.title = doc.title
      this.documentForm.patchValue(doc)
    }, error => {this.router.navigate(['404'])})
  }

  save() {
    this.networkActive = true
    this.store.next(this.documentForm.value)
    this.documentsService.update(this.document).pipe(first()).subscribe(result => {
      this.close()
      this.networkActive = false
      this.error = null
    }, error => {
      this.networkActive = false
      this.error = error.error
    })
  }

  saveEditNext() {
    this.networkActive = true
    this.store.next(this.documentForm.value)
    this.documentsService.update(this.document).pipe(first()).subscribe(result => {
      this.error = null
      this.documentListViewService.getNext(this.documentId).pipe(first()).subscribe(nextDocId => {
        this.networkActive = false
        if (nextDocId) {
          this.openDocumentService.closeDocument(this.document, true).pipe(first()).subscribe(closed => {
            if (closed) {
              this.router.navigate(['documents', nextDocId])
              this.titleInput.focus()
            }
          })
        }
      }, error => {
        this.networkActive = false
      })
    }, error => {
      this.networkActive = false
      this.error = error.error
    })
  }

  close() {
    this.openDocumentService.closeDocument(this.document).pipe(first()).subscribe(closed => {
      if (!closed) return;
      if (this.documentListViewService.activeSavedViewId) {
        this.router.navigate(['view', this.documentListViewService.activeSavedViewId])
      } else {
        this.router.navigate(['documents'])
      }
    })
  }

  delete() {
    let modal = this.modalService.open(ConfirmDialogComponent, {backdrop: 'static'})
    modal.componentInstance.title = $localize`Confirm delete`
    modal.componentInstance.messageBold = $localize`Do you really want to delete document "${this.document.title}"?`
    modal.componentInstance.message = $localize`The files for this document will be deleted permanently. This operation cannot be undone.`
    modal.componentInstance.btnClass = "btn-danger"
    modal.componentInstance.btnCaption = $localize`Delete document`
    modal.componentInstance.confirmClicked.pipe(first()).subscribe(() => {
      modal.componentInstance.buttonsEnabled = false
      this.documentsService.delete(this.document).pipe(first()).subscribe(() => {
        modal.close()
        this.close()
      }, error => {
        this.toastService.showError($localize`Error deleting document: ${JSON.stringify(error)}`)
        modal.componentInstance.buttonsEnabled = true
      })
    })

  }

  moreLike() {
    this.documentListViewService.quickFilter([{rule_type: FILTER_FULLTEXT_MORELIKE, value: this.documentId.toString()}])
  }

  hasNext() {
    return this.documentListViewService.hasNext(this.documentId)
  }

  pdfPreviewLoaded(pdf: PDFDocumentProxy) {
    this.previewNumPages = pdf.numPages
  }

}
