import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing'
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap'
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing'
import { EditDialogMode } from '../edit-dialog.component'
import { IfOwnerDirective } from 'src/app/directives/if-owner.directive'
import { IfPermissionsDirective } from 'src/app/directives/if-permissions.directive'
import { SelectComponent } from '../../input/select/select.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TextComponent } from '../../input/text/text.component'
import { NgSelectModule } from '@ng-select/ng-select'
import { PermissionsFormComponent } from '../../input/permissions/permissions-form/permissions-form.component'
import { MailAccountEditDialogComponent } from './mail-account-edit-dialog.component'
import { PasswordComponent } from '../../input/password/password.component'
import { CheckComponent } from '../../input/check/check.component'
import { IMAPSecurity } from 'src/app/data/paperless-mail-account'
import { environment } from 'src/environments/environment'

describe('MailAccountEditDialogComponent', () => {
  let component: MailAccountEditDialogComponent
  let fixture: ComponentFixture<MailAccountEditDialogComponent>
  let httpController: HttpTestingController

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        MailAccountEditDialogComponent,
        IfPermissionsDirective,
        IfOwnerDirective,
        SelectComponent,
        TextComponent,
        CheckComponent,
        PermissionsFormComponent,
        PasswordComponent,
      ],
      providers: [NgbActiveModal],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        NgSelectModule,
        NgbModule,
      ],
    }).compileComponents()

    httpController = TestBed.inject(HttpTestingController)

    fixture = TestBed.createComponent(MailAccountEditDialogComponent)
    component = fixture.componentInstance

    fixture.detectChanges()
  })

  it('should support create and edit modes', () => {
    component.dialogMode = EditDialogMode.CREATE
    const createTitleSpy = jest.spyOn(component, 'getCreateTitle')
    const editTitleSpy = jest.spyOn(component, 'getEditTitle')
    fixture.detectChanges()
    expect(createTitleSpy).toHaveBeenCalled()
    expect(editTitleSpy).not.toHaveBeenCalled()
    component.dialogMode = EditDialogMode.EDIT
    fixture.detectChanges()
    expect(editTitleSpy).toHaveBeenCalled()
  })

  it('should support test mail account and show appropriate expiring alert', fakeAsync(() => {
    component.object = {
      name: 'example',
      imap_server: 'imap.example.com',
      username: 'user',
      password: 'pass',
      imap_port: 443,
      imap_security: IMAPSecurity.SSL,
      is_token: false,
    }

    // success
    component.test()
    httpController
      .expectOne(`${environment.apiBaseUrl}mail_accounts/test/`)
      .flush({ success: true })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain(
      'Successfully connected'
    )
    tick(6000)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).not.toContain(
      'Successfully connected'
    )

    // not success
    component.test()
    httpController
      .expectOne(`${environment.apiBaseUrl}mail_accounts/test/`)
      .flush({ success: false })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Unable to connect')

    // error
    component.test()
    httpController
      .expectOne(`${environment.apiBaseUrl}mail_accounts/test/`)
      .flush({}, { status: 500, statusText: 'error' })
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Unable to connect')
    tick(6000)
  }))
})
