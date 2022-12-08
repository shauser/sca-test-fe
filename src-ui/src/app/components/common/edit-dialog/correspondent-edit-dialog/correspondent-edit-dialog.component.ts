import { Component } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { EditDialogComponent } from 'src/app/components/common/edit-dialog/edit-dialog.component'
import { DEFAULT_MATCHING_ALGORITHM } from 'src/app/data/matching-model'
import { PaperlessCorrespondent } from 'src/app/data/paperless-correspondent'
import { CorrespondentService } from 'src/app/services/rest/correspondent.service'

@Component({
  selector: 'app-correspondent-edit-dialog',
  templateUrl: './correspondent-edit-dialog.component.html',
  styleUrls: ['./correspondent-edit-dialog.component.scss'],
})
export class CorrespondentEditDialogComponent extends EditDialogComponent<PaperlessCorrespondent> {
  constructor(service: CorrespondentService, activeModal: NgbActiveModal) {
    super(service, activeModal)
  }

  getCreateTitle() {
    return $localize`Create new correspondent`
  }

  getEditTitle() {
    return $localize`Edit correspondent`
  }

  getForm(): FormGroup {
    return new FormGroup({
      name: new FormControl(''),
      matching_algorithm: new FormControl(DEFAULT_MATCHING_ALGORITHM),
      match: new FormControl(''),
      is_insensitive: new FormControl(true),
      set_permissions: new FormGroup({
        view: new FormGroup({
          users: new FormControl(null),
          groups: new FormControl(null),
        }),
        change: new FormGroup({
          users: new FormControl(null),
          groups: new FormControl(null),
        }),
      }),
    })
  }
}
