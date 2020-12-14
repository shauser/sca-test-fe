import { Injectable } from '@angular/core';
import { PaperlessDocument } from 'src/app/data/paperless-document';
import { PaperlessDocumentMetadata } from 'src/app/data/paperless-document-metadata';
import { AbstractPaperlessService } from './abstract-paperless-service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Results } from 'src/app/data/results';
import { FilterRule } from 'src/app/data/filter-rule';
import { map } from 'rxjs/operators';
import { CorrespondentService } from './correspondent.service';
import { DocumentTypeService } from './document-type.service';
import { TagService } from './tag.service';
import { FILTER_RULE_TYPES } from 'src/app/data/filter-rule-type';

export const DOCUMENT_SORT_FIELDS = [
  { field: "correspondent__name", name: "Correspondent" },
  { field: "document_type__name", name: "Document type" },
  { field: 'title', name: 'Title' },
  { field: 'archive_serial_number', name: 'ASN' },
  { field: 'created', name: 'Created' },
  { field: 'added', name: 'Added' },
  { field: 'modified', name: 'Modified' }
]

@Injectable({
  providedIn: 'root'
})
export class DocumentService extends AbstractPaperlessService<PaperlessDocument> {

  constructor(http: HttpClient, private correspondentService: CorrespondentService, private documentTypeService: DocumentTypeService, private tagService: TagService) {
    super(http, 'documents')
  }

  private filterRulesToQueryParams(filterRules: FilterRule[]) {
    if (filterRules) {
      let params = {}
      for (let rule of filterRules) {
        let ruleType = FILTER_RULE_TYPES.find(t => t.id == rule.rule_type)
        if (ruleType.multi) {
          params[ruleType.filtervar] = params[ruleType.filtervar] ? params[ruleType.filtervar] + "," + rule.value : rule.value
        } else {
          params[ruleType.filtervar] = rule.value
        }
      }
      return params
    } else {
      return null
    }
  }

  addObservablesToDocument(doc: PaperlessDocument) {
    if (doc.correspondent) {
      doc.correspondent$ = this.correspondentService.getCached(doc.correspondent)
    }
    if (doc.document_type) {
      doc.document_type$ = this.documentTypeService.getCached(doc.document_type)
    }
    if (doc.tags) {
      doc.tags$ = this.tagService.getCachedMany(doc.tags)
    }
    return doc
  }

  list(page?: number, pageSize?: number, sortField?: string, sortReverse?: boolean, filterRules?: FilterRule[]): Observable<Results<PaperlessDocument>> {
    return super.list(page, pageSize, sortField, sortReverse, this.filterRulesToQueryParams(filterRules)).pipe(
      map(results => {
        results.results.forEach(doc => this.addObservablesToDocument(doc))
        return results
      })
    )
  }

  getPreviewUrl(id: number, original: boolean = false): string {
    let url = this.getResourceUrl(id, 'preview')
    if (original) {
      url += "?original=true"
    }
    return url
  }

  getThumbUrl(id: number): string {
    return this.getResourceUrl(id, 'thumb')
  }

  getDownloadUrl(id: number, original: boolean = false): string {
    let url = this.getResourceUrl(id, 'download')
    if (original) {
      url += "?original=true"
    }
    return url
  }

  uploadDocument(formData) {
    return this.http.post(this.getResourceUrl(null, 'post_document'), formData, {reportProgress: true, observe: "events"})
  }

  getMetadata(id: number): Observable<PaperlessDocumentMetadata> {
    return this.http.get<PaperlessDocumentMetadata>(this.getResourceUrl(id, 'metadata'))
  }

}
