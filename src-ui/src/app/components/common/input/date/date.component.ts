import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerContent } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from 'src/app/services/settings.service';
import { LocalizedDateParserFormatter } from 'src/app/utils/ngb-date-parser-formatter';
import { v4 as uuidv4 } from 'uuid';
import { AbstractInputComponent } from '../abstract-input';


@Component({
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DateComponent),
    multi: true
  }],
  selector: 'app-input-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss']
})
export class DateComponent extends AbstractInputComponent<string> implements OnInit {

  constructor(private settings: SettingsService) {
    super()
  }

  ngOnInit(): void {
    super.ngOnInit()
    this.placeholder = this.settings.getLocalizedDateInputFormat()
  }

  placeholder: string

  // Allow dates to be specified without 'padding' e.g. 2/3
  onFocusOut() {
    if (!this.value || this.value.length > 8) return; // its already been formatted
    if ([',','.','/','-'].some(sep => this.value.includes(sep))) {
      let valArr = this.value.split(/[\.,\/-]+/)
      valArr = valArr.map(segment => segment.padStart(2,'0'))
      let dateFormatter = new LocalizedDateParserFormatter(this.settings)
      this.value = dateFormatter.preformatDateInput(valArr.join(''))
    }
  }

  // prevent chars other than numbers and separators
  onKeyPress(event: KeyboardEvent) {
    if (!/[0-9,\.\/-]+/.test(event.key)) {
      event.preventDefault();
    }
  }
}
