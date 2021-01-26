import { Component, Inject, LOCALE_ID, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PaperlessSavedView } from 'src/app/data/paperless-saved-view';
import { DocumentListViewService } from 'src/app/services/document-list-view.service';
import { SavedViewService } from 'src/app/services/rest/saved-view.service';
import { LanguageOption, SettingsService, SETTINGS_KEYS } from 'src/app/services/settings.service';
import { ToastService } from 'src/app/services/toast.service';
import { dirtyCheck, DirtyComponent } from '@ngneat/dirty-check-forms';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy, DirtyComponent {

  savedViewGroup = new FormGroup({})

  settingsForm = new FormGroup({
    'bulkEditConfirmationDialogs': new FormControl(null),
    'bulkEditApplyOnClose': new FormControl(null),
    'documentListItemPerPage': new FormControl(null),
    'darkModeUseSystem': new FormControl(null),
    'darkModeEnabled': new FormControl(null),
    'useNativePdfViewer': new FormControl(null),
    'savedViews': this.savedViewGroup,
    'displayLanguage': new FormControl(null),
    'dateLocale': new FormControl(null),
    'dateFormat': new FormControl(null),
  })

  savedViews: PaperlessSavedView[]

  store: BehaviorSubject<any>
  storeSub: Subscription
  isDirty$: Observable<boolean>

  get computedDateLocale(): string {
    return this.settingsForm.value.dateLocale || this.settingsForm.value.displayLanguage
  }

  constructor(
    public savedViewService: SavedViewService,
    private documentListViewService: DocumentListViewService,
    private toastService: ToastService,
    private settings: SettingsService,
    @Inject(LOCALE_ID) public currentLocale: string
  ) { }

  ngOnInit() {
    this.savedViewService.listAll().subscribe(r => {
      this.savedViews = r.results
      let storeData = {
        'bulkEditConfirmationDialogs': this.settings.get(SETTINGS_KEYS.BULK_EDIT_CONFIRMATION_DIALOGS),
        'bulkEditApplyOnClose': this.settings.get(SETTINGS_KEYS.BULK_EDIT_APPLY_ON_CLOSE),
        'documentListItemPerPage': this.settings.get(SETTINGS_KEYS.DOCUMENT_LIST_SIZE),
        'darkModeUseSystem': this.settings.get(SETTINGS_KEYS.DARK_MODE_USE_SYSTEM),
        'darkModeEnabled': this.settings.get(SETTINGS_KEYS.DARK_MODE_ENABLED),
        'useNativePdfViewer': this.settings.get(SETTINGS_KEYS.USE_NATIVE_PDF_VIEWER),
        'savedViews': {},
        'displayLanguage': this.settings.getLanguage(),
        'dateLocale': this.settings.get(SETTINGS_KEYS.DATE_LOCALE),
        'dateFormat': this.settings.get(SETTINGS_KEYS.DATE_FORMAT),
      }

      for (let view of this.savedViews) {
        storeData.savedViews[view.id.toString()] = {
          "id": view.id,
          "name": view.name,
          "show_on_dashboard": view.show_on_dashboard,
          "show_in_sidebar": view.show_in_sidebar
        }
        this.savedViewGroup.addControl(view.id.toString(), new FormGroup({
          "id": new FormControl(null),
          "name": new FormControl(null),
          "show_on_dashboard": new FormControl(null),
          "show_in_sidebar": new FormControl(null)
        }))
      }

      this.store = new BehaviorSubject(storeData)

      this.storeSub = this.store.asObservable().subscribe(state => {
        this.settingsForm.patchValue(state, { emitEvent: false })
      })

      // Initialize dirtyCheck
      this.isDirty$ = dirtyCheck(this.settingsForm, this.store.asObservable())
    })
  }

  ngOnDestroy() {
    this.storeSub && this.storeSub.unsubscribe();
  }

  deleteSavedView(savedView: PaperlessSavedView) {
    this.savedViewService.delete(savedView).subscribe(() => {
      this.savedViewGroup.removeControl(savedView.id.toString())
      this.savedViews.splice(this.savedViews.indexOf(savedView), 1)
      this.toastService.showInfo($localize`Saved view "${savedView.name}" deleted.`)
    })
  }

  private saveLocalSettings() {
    this.settings.set(SETTINGS_KEYS.BULK_EDIT_APPLY_ON_CLOSE, this.settingsForm.value.bulkEditApplyOnClose)
    this.settings.set(SETTINGS_KEYS.BULK_EDIT_CONFIRMATION_DIALOGS, this.settingsForm.value.bulkEditConfirmationDialogs)
    this.settings.set(SETTINGS_KEYS.DOCUMENT_LIST_SIZE, this.settingsForm.value.documentListItemPerPage)
    this.settings.set(SETTINGS_KEYS.DARK_MODE_USE_SYSTEM, this.settingsForm.value.darkModeUseSystem)
    this.settings.set(SETTINGS_KEYS.DARK_MODE_ENABLED, (this.settingsForm.value.darkModeEnabled == true).toString())
    this.settings.set(SETTINGS_KEYS.USE_NATIVE_PDF_VIEWER, this.settingsForm.value.useNativePdfViewer)
    this.settings.set(SETTINGS_KEYS.DATE_LOCALE, this.settingsForm.value.dateLocale)
    this.settings.set(SETTINGS_KEYS.DATE_FORMAT, this.settingsForm.value.dateFormat)
    this.settings.setLanguage(this.settingsForm.value.displayLanguage)
    this.store.next(this.settingsForm.value)
    this.documentListViewService.updatePageSize()
    this.settings.updateDarkModeSettings()
    this.toastService.showInfo($localize`Settings saved successfully.`)
  }

  get displayLanguageOptions(): LanguageOption[] {
    return [{code: "", name: $localize`Use system language`}].concat(this.settings.getLanguageOptions())
  }

  get dateLocaleOptions(): LanguageOption[] {
    return [{code: "", name: $localize`Use date format of display language`}].concat(this.settings.getLanguageOptions())
  }

  get today() {
    return new Date()
  }

  saveSettings() {
    let x = []
    for (let id in this.savedViewGroup.value) {
      x.push(this.savedViewGroup.value[id])
    }
    if (x.length > 0) {
      this.savedViewService.patchMany(x).subscribe(s => {
        this.saveLocalSettings()
      }, error => {
        this.toastService.showError($localize`Error while storing settings on server: ${JSON.stringify(error.error)}`)
      })
    } else {
      this.saveLocalSettings()
    }

  }
}
