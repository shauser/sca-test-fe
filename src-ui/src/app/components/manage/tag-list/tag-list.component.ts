import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FILTER_HAS_TAGS_ALL } from 'src/app/data/filter-rule-type';
import { TAG_COLOURS, PaperlessTag } from 'src/app/data/paperless-tag';
import { DocumentListViewService } from 'src/app/services/document-list-view.service';
import { TagService } from 'src/app/services/rest/tag.service';
import { ToastService } from 'src/app/services/toast.service';
import { GenericListComponent } from '../generic-list/generic-list.component';
import { TagEditDialogComponent } from './tag-edit-dialog/tag-edit-dialog.component';

@Component({
  selector: 'app-tag-list',
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.scss']
})
export class TagListComponent extends GenericListComponent<PaperlessTag> {

  constructor(tagService: TagService, modalService: NgbModal,
    private list: DocumentListViewService,
    toastService: ToastService
  ) {
    super(tagService, modalService, TagEditDialogComponent, toastService)
  }

  getColor(id) {
    return TAG_COLOURS.find(c => c.id == id)
  }

  getDeleteMessage(object: PaperlessTag) {
    return $localize`Do you really want to delete the tag "${object.name}"?`
  }

  filterDocuments(object: PaperlessTag) {
    this.list.quickFilter([{rule_type: FILTER_HAS_TAGS_ALL, value: object.id.toString()}])

  }
}
