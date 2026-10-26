import { Component } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'

import { NavBarComponent } from './nav-bar.component'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { MsalService } from '@azure/msal-angular'
import { SettingsService } from '../../settings/settings.service'
import { AppService } from 'src/app/service/app.service'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { FormsModule } from '@angular/forms'
import { PrimengModule } from 'src/app/shared/primeng/primeng.module'
import { StoreModule } from '@ngrx/store'
import { settingsReducer } from '../../settings/settingsStore/settings.reducer'
import { RouterTestingModule } from '@angular/router/testing'
import { MockMsalService } from 'src/mocks/mock-msal.service'
import { MockSettingsService } from '../../settings/mocks/mock-settings.service'
import { MockMixPanelService } from 'src/mocks/mock-mixpanel.service'
import { MockAppService } from 'src/mocks/mock-app.service'

@Component({ template: '', standalone: true })
class RouteTargetTestComponent {}

describe('NavBarComponent', () => {
    let component: NavBarComponent
    let fixture: ComponentFixture<NavBarComponent>
    let activatedRoute: ActivatedRoute
    let httpMock: HttpTestingController
    let msalService: MsalService
    let settingService: SettingsService
    let appService: AppService
    let mixpanelService: MixpanelService
    let store: MockStore
    let initialState = {}

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                PrimengModule,
                StoreModule.forRoot({ settingsReducer: settingsReducer }),
                RouterTestingModule.withRoutes([
                    { path: '', component: RouteTargetTestComponent, pathMatch: 'full' },
                    { path: 'dashboard', component: RouteTargetTestComponent },
                    { path: 'users', component: RouteTargetTestComponent },
                    { path: 'myTeam', component: RouteTargetTestComponent },
                    { path: 'settings', component: RouteTargetTestComponent },
                ]),
                HttpClientTestingModule,
                NavBarComponent,
            ],
            providers: [
                provideMockStore(),
                { provide: MsalService, useClass: MockMsalService },
                { provide: SettingsService, useClass: MockSettingsService },
                { provide: AppService, useClass: MockAppService },
                { provide: MixpanelService, useClass: MockMixPanelService },
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
        fixture = TestBed.createComponent(NavBarComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should render account selection dropdown next to logo', () => {
        component.allAccounts = [1, 2, 3]
        fixture.detectChanges()
        const dropdownEl = fixture.debugElement.nativeElement.querySelector('[data-testId="logo-dropdown"]')
        expect(dropdownEl).toBeTruthy()
    })

    it('should render logo', () => {
        component.allAccounts = [1, 2, 3]
        component.selectedAccount = 1
        fixture.detectChanges()
        const logoEl = fixture.debugElement.nativeElement.querySelector('[data-testId="logo"]')
        expect(logoEl).toBeTruthy()
    })

    it('should render menu', () => {
        const menuEl = fixture.debugElement.nativeElement.querySelector('[data-testId="menu"]')
        expect(menuEl).toBeTruthy()
        expect(component.items1.length).toBeGreaterThan(0)
    })

    it('should highlight Dashboard by default and nothing else', () => {
        const [dashboard, users, myTeam, settings] = component.items1
        expect(dashboard.styleClass).toBe('active')
        expect(users.styleClass).toBe('')
        expect(myTeam.styleClass).toBe('')
        expect(settings.styleClass).toBe('')
    })

    it('should highlight Users (and only Users) after navigating to /users', fakeAsync(() => {
        const router = TestBed.inject(Router)
        router.navigateByUrl('/users')
        tick()
        fixture.detectChanges()

        const [dashboard, users, myTeam, settings] = component.items1
        expect(users.styleClass).toBe('active')
        expect(dashboard.styleClass).toBe('')
        expect(myTeam.styleClass).toBe('')
        expect(settings.styleClass).toBe('')
    }))

    it('should highlight My Team after navigating to /myTeam, and drop it once back on /users', fakeAsync(() => {
        const router = TestBed.inject(Router)

        router.navigateByUrl('/myTeam')
        tick()
        fixture.detectChanges()
        expect(component.items1[2].styleClass).toBe('active')

        router.navigateByUrl('/users')
        tick()
        fixture.detectChanges()
        expect(component.items1[2].styleClass).toBe('')
        expect(component.items1[1].styleClass).toBe('active')
    }))

    it('should not highlight Dashboard once navigated away from root (regression: subset matching would light up every tab on "/")', fakeAsync(() => {
        const router = TestBed.inject(Router)
        router.navigateByUrl('/settings')
        tick()
        fixture.detectChanges()

        expect(component.items1[0].styleClass).toBe('')
        expect(component.items1[3].styleClass).toBe('active')
    }))

    it('should render search bar', () => {
        component.permissionObject = {}
        component.permissionObject['Page-Search-All-Accounts'] = true
        fixture.detectChanges()
        const searchEl = fixture.debugElement.nativeElement.querySelector('[data-testId="searchbar"]')
        expect(searchEl).toBeTruthy()
    })

    it('should render search button and call "searcMultipleAccounts" on click', fakeAsync(() => {
        component.permissionObject = {}
        component.permissionObject['Page-Search-All-Accounts'] = true
        fixture.detectChanges()
        const btnEl = fixture.debugElement.nativeElement.querySelector('[data-testId="search-btn"]')
        expect(btnEl).toBeTruthy()

        spyOn(component, 'searcMultipleAccounts')
        btnEl.click()
        tick()
        expect(component.searcMultipleAccounts).toHaveBeenCalled()
    }))

    it('should render help center icon', () => {
        component.permissionObject = {}
        component.permissionObject['Page-Help'] = true
        fixture.detectChanges()
        const searchEl = fixture.debugElement.nativeElement.querySelector('[data-testId="help-center-icon"]')
        expect(searchEl).toBeTruthy()
    })

    it('should render user profile avatar', () => {
        const avatarEl = fixture.debugElement.nativeElement.querySelector('[data-testId="avatar"]')
        expect(avatarEl).toBeTruthy()
    })

    it('should render user profile menu', () => {
        const profileMenuEl = fixture.debugElement.nativeElement.querySelector('[data-testId="profile-menu"]')
        expect(profileMenuEl).toBeTruthy()
    })
})
