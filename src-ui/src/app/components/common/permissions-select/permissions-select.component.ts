import { Component, forwardRef, Input, OnInit } from '@angular/core'
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms'
import {
  PermissionAction,
  PermissionsService,
  PermissionType,
} from 'src/app/services/permissions.service'

@Component({
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PermissionsSelectComponent),
      multi: true,
    },
  ],
  selector: 'app-permissions-select',
  templateUrl: './permissions-select.component.html',
  styleUrls: ['./permissions-select.component.scss'],
})
export class PermissionsSelectComponent
  implements OnInit, ControlValueAccessor
{
  PermissionType = PermissionType
  PermissionAction = PermissionAction

  @Input()
  title: string = 'Permissions'

  @Input()
  error: string

  permissions: string[]

  form = new FormGroup({})

  typesWithAllActions: Set<string> = new Set()

  _inheritedPermissions: string[] = []

  @Input()
  set inheritedPermissions(inherited: string[]) {
    // remove <app_label>. from permission strings
    this._inheritedPermissions = inherited?.length
      ? inherited.map((p) => p.replace(/^\w+\./g, ''))
      : []
  }

  inheritedWarning: string = $localize`Inerhited from group`

  constructor(private readonly permissionsService: PermissionsService) {
    for (const type in PermissionType) {
      const control = new FormGroup({})
      for (const action in PermissionAction) {
        control.addControl(action, new FormControl(null))
      }
      this.form.addControl(type, control)
    }
  }

  writeValue(permissions: string[]): void {
    this.permissions = permissions ?? []
    const allPerms = this._inheritedPermissions.concat(this.permissions)

    allPerms.forEach((permissionStr) => {
      const { actionKey, typeKey } =
        this.permissionsService.getPermissionKeys(permissionStr)

      if (actionKey && typeKey) {
        if (this.form.get(typeKey)?.get(actionKey)) {
          this.form
            .get(typeKey)
            .get(actionKey)
            .patchValue(true, { emitEvent: false })
        }
      }
    })
    Object.keys(PermissionType).forEach((type) => {
      if (
        Object.values(this.form.get(type).value).every((val) => val == true)
      ) {
        this.typesWithAllActions.add(type)
      } else {
        this.typesWithAllActions.delete(type)
      }
    })
  }

  onChange = (newValue: string[]) => {}

  onTouched = () => {}

  disabled: boolean = false

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe((newValue) => {
      let permissions = []
      Object.entries(newValue).forEach(([typeKey, typeValue]) => {
        // e.g. [Document, { Add: true, View: true ... }]
        const selectedActions = Object.entries(typeValue).filter(
          ([actionKey, actionValue]) => actionValue == true
        )

        selectedActions.forEach(([actionKey, actionValue]) => {
          permissions.push(
            (PermissionType[typeKey] as string).replace(
              '%s',
              PermissionAction[actionKey]
            )
          )
        })

        if (selectedActions.length == Object.entries(typeValue).length) {
          this.typesWithAllActions.add(typeKey)
        } else {
          this.typesWithAllActions.delete(typeKey)
        }
      })
      this.onChange(permissions)
    })
  }

  toggleAll(event, type) {
    const typeGroup = this.form.get(type)
    if (event.target.checked) {
      Object.keys(PermissionAction).forEach((action) => {
        typeGroup.get(action).patchValue(true)
      })
      this.typesWithAllActions.add(type)
    } else {
      Object.keys(PermissionAction).forEach((action) => {
        typeGroup.get(action).patchValue(false)
      })
      this.typesWithAllActions.delete(type)
    }
  }

  isInherited(typeKey: string, actionKey: string = null) {
    if (this._inheritedPermissions.length == 0) return false
    else if (actionKey) {
      return this._inheritedPermissions.includes(
        this.permissionsService.getPermissionCode(
          PermissionAction[actionKey],
          PermissionType[typeKey]
        )
      )
    } else {
      return Object.values(PermissionAction).every((action) => {
        return this._inheritedPermissions.includes(
          this.permissionsService.getPermissionCode(
            action as PermissionAction,
            PermissionType[typeKey]
          )
        )
      })
    }
  }

  // if checkbox is disabled either because "All", inhereted or entire component disabled
  isDisabled(typeKey: string, actionKey: string) {
    return this.typesWithAllActions.has(typeKey) ||
      this.isInherited(typeKey, actionKey) ||
      this.disabled
      ? true
      : null
  }
}
