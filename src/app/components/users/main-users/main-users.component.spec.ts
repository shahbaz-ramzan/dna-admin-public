import { ComponentFixture, TestBed } from '@angular/core/testing'

import { MainUsersComponent } from './main-users.component'
import { ActivatedRoute } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from '../../settings/settings.service'
import { MsgService } from 'src/app/service/msg.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { ConfirmationService } from 'primeng/api'
import { MainUsersService } from '../main-users.service'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { settingsReducer } from '../../settings/settingsStore/settings.reducer'
import { initialTourState } from '../../tour/tour.reducer'
import { RouterTestingModule } from '@angular/router/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../../settings/mocks/mock-settings.service'
import { MockMsgService } from 'src/mocks/mock-msg.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockConfirmationService } from 'src/mocks/mock-confirmation.service'
import { MockMainUsersService } from 'src/mocks/mock-main-users.service'
import { By } from '@angular/platform-browser'
import { SortablejsModule } from '@maksim_m/ngx-sortablejs'
import { CommonModule } from '@angular/common'
import { DoubleUserSelectionComponent } from './double-user-selection/double-user-selection.component'
import { SingleUserSelectionComponent } from './single-user-selection/single-user-selection.component'
import { ThreeUserSelectionComponent } from './three-user-selection/three-user-selection.component'
import K from 'src/app/constants'
import Encryption from 'src/app/util/Encryption'

describe('MainUsersComponent', () => {
    let component: MainUsersComponent
    let fixture: ComponentFixture<MainUsersComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let msgService: MsgService
    let mixpanelService: MixpanelService
    let confirmationService: ConfirmationService
    let mainUsersService: MainUsersService
    let store: MockStore
    let initialState = { tourReducer: initialTourState }

    beforeEach(() => {
        localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify({ personId: 'test-person-id' })))
        localStorage.setItem('tScoreColor', Encryption.encryptData('#ffffff'))
    })

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                SortablejsModule,
                CommonModule,
                PrimengModule,
                StoreModule.forRoot({ settingsReducer: settingsReducer }),
                RouterTestingModule.withRoutes([]),
                HttpClientTestingModule,
                SingleUserSelectionComponent,
                MainUsersComponent,
            ],
            // DoubleUserSelectionComponent, SingleUserSelectionComponent, ThreeUserSelectionComponent
            providers: [
                provideMockStore(),
                { provide: MsalService, useClass: MockMsalService },
                { provide: SettingsService, useClass: MockSettingsService },
                { provide: MsgService, useClass: MockMsgService },
                { provide: MixpanelService, useClass: MockMixPanelService },
                { provide: ConfirmationService, useClass: MockConfirmationService },
                { provide: MainUsersService, useClass: MockMainUsersService },
            ],
        }).compileComponents()
    })

    beforeEach(() => {
        store = TestBed.get(MockStore)
        spyOn(store, 'select').and.callThrough()
        spyOn(store, 'dispatch')
        store.setState(initialState)
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(MainUsersComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render user avatar', () => {
        component.permissionObject = {}
        component.permissionObject['Feature-User-Card-Filter'] = true
        fixture.detectChanges()

        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="user-avatar"]')
        expect(el).toBeTruthy()
    })

    it('should render search input field and call "searchUser"', () => {
        component.permissionObject = {}
        component.permissionObject['Feature-User-Search'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="search-input"]')
        expect(el).toBeTruthy()

        spyOn(component, 'searchUser')
        el = fixture.debugElement.query(By.css('[data-testId="search-input"]'))
        el.triggerEventHandler('keyup.enter', null)
        expect(component.searchUser).toHaveBeenCalled()
    })

    it('should render search button field and call "searchUser" on click', () => {
        component.permissionObject = {}
        component.permissionObject['Feature-User-Search'] = true
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="search-btn"]')
        expect(el).toBeTruthy()

        spyOn(component, 'searchUser')
        el = fixture.debugElement.query(By.css('[data-testId="search-btn"]'))
        el.triggerEventHandler('click', null)
        expect(component.searchUser).toHaveBeenCalled()
    })

    it('should render download button field and call "downloadData" on click', () => {
        component.isAllaccountsList = false
        component.usersList = [{ accountName: 'aown', firstName: 'aown', lastName: 'ali', personID: '123', profilePictureUrl: 'abc', uniqueStyle: '' }]
        fixture.detectChanges()

        let el = fixture.debugElement.nativeElement.querySelector('[data-testId="download-btn"]')
        expect(el).toBeTruthy()

        spyOn(component, 'downloadData')
        el = fixture.debugElement.query(By.css('[data-testId="download-btn"]'))
        el.triggerEventHandler('click', null)
        expect(component.downloadData).toHaveBeenCalled()
    })

    it('should render users table', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="user-table"]')
        expect(el).toBeTruthy()
    })

    it('should render singleSelectionComponent', () => {
        component.selectedPersons = ['a']
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="singleSelectionComponent"]')
        expect(el).toBeTruthy()
    })

    it('should render doubleSelectionComponent', () => {
        component.selectedPersons = ['a', 'b']
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="doubleSelectionComponent"]')
        expect(el).toBeTruthy()
    })

    it('should render threeSelectionComponent', () => {
        component.selectedPersons = ['a', 'b', 'c']
        fixture.detectChanges()
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="threeSelectionComponent"]')
        expect(el).toBeTruthy()
    })

    it('should render sidebar', () => {
        const el = fixture.debugElement.nativeElement.querySelector('[data-testId="sidebar"]')
        expect(el).toBeTruthy()
    })

    // it('should render "Filters" title in sidebar', () => {
    //     const sidebar = fixture.debugElement.nativeElement.querySelector('[data-testId="sidebar"]')
    //     sidebar.removeAttribute('visible')
    //     fixture.detectChanges()

    //     const el = fixture.debugElement.nativeElement.querySelector('[data-testId="filters"]')
    //     expect(el.textContent).toContain('Filters')
    // })
})
