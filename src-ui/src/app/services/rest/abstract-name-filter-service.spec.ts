import { HttpTestingController } from '@angular/common/http/testing'
import { Subscription } from 'rxjs'
import { TestBed } from '@angular/core/testing'
import { environment } from 'src/environments/environment'
import { AbstractNameFilterService } from './abstract-name-filter-service'
import { commonAbstractPaperlessServiceTests } from './abstract-paperless-service.spec'

let httpTestingController: HttpTestingController
let service: AbstractNameFilterService<any>
let subscription: Subscription

export const commonAbstractNameFilterPaperlessServiceTests = (
  endpoint,
  ServiceClass
) => {
  commonAbstractPaperlessServiceTests(endpoint, ServiceClass)

  describe(`Common name filter service tests for ${endpoint}`, () => {
    test('should call appropriate api endpoint for list filtering', () => {
      const page = 2
      const pageSize = 50
      const sortField = 'name'
      const sortReverse = true
      const nameFilter = 'hello'
      const fullPerms = true
      subscription = service
        .listFiltered(
          page,
          pageSize,
          sortField,
          sortReverse,
          nameFilter,
          fullPerms
        )
        .subscribe()
      const req = httpTestingController.expectOne(
        `${environment.apiBaseUrl}${endpoint}/?page=${page}&page_size=${pageSize}&ordering=-${sortField}&name__icontains=${nameFilter}&full_perms=true`
      )
      expect(req.request.method).toEqual('GET')
      req.flush([])
    })

    test('should call appropriate api endpoint for bulk permissions edit', () => {
      const owner = 3
      const permissions = {
        view: {
          users: [],
          groups: [3],
        },
        change: {
          users: [12, 13],
          groups: [],
        },
      }
      subscription = service
        .bulk_update_permissions(
          [1, 2],
          {
            owner,
            set_permissions: permissions,
          },
          true
        )
        .subscribe()
      const req = httpTestingController.expectOne(
        `${environment.apiBaseUrl}bulk_edit_object_perms/`
      )
      expect(req.request.method).toEqual('POST')
      req.flush([])
    })
  })

  beforeEach(() => {
    // Dont need to setup again
    // TestBed.configureTestingModule({
    //   providers: [ServiceClass],
    //   imports: [HttpClientTestingModule],
    //   teardown: { destroyAfterEach: true },
    // })

    httpTestingController = TestBed.inject(HttpTestingController)
    service = TestBed.inject(ServiceClass)
  })

  afterEach(() => {
    subscription?.unsubscribe()
    // httpTestingController.verify()
  })
}
