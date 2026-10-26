import { CommonModule } from '@angular/common'
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms'
import { Actions, ofType } from '@ngrx/effects'
import { Store } from '@ngrx/store'
import { ButtonModule } from 'primeng/button'
import { FileUpload } from 'primeng/fileupload'
import { LoadingSpinnerComponent } from 'src/app/components/common/loading-spinner/loading-spinner.component'
import K from 'src/app/constants'
import { MixpanelService } from 'src/app/service/mixpanel.service'
import { MsgService } from 'src/app/service/msg.service'
import Encryption from 'src/app/util/Encryption'
import { EDIT_PROFILE_FAILURE_ACTION, FAILURE_UPLOAD_PROFILE_PICTURE_ACTION } from '../settingsStore/settings-actions-constants'
import {
    editProfileAction,
    editProfileSuccessAction,
    getProfilePictureAction,
    SuccessUploadProfilePicture,
    uploadProfilePicture,
} from '../settingsStore/settings.actions'
@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, LoadingSpinnerComponent],
    templateUrl: './my-profile.component.html',
    styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit {
    private destroyRef = inject(DestroyRef)
    image: any = '../../../../assets/images/profile.svg'
    imageFormats: string
    isProfileLoading: boolean

    myProfileForm: UntypedFormGroup
    @ViewChild(FileUpload)
    fileUpload: FileUpload
    personId: any
    user_object: any = {
        personId: '',
        email: '',
        fullName: '',
        fisrtName: '',
        lastName: '',
    }
    permissionObject: any

    constructor(
        private store: Store<{ settingsReducer: any }>,
        private actions: Actions,
        private msgService: MsgService,
        private mixpanelService: MixpanelService
    ) {
        this.user_object = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (this.user_object) {
            this.user_object = JSON.parse(this.user_object)
        }

        this.permissionObject = Encryption.decryptData(localStorage.getItem(K.APP.PERMISSION_OBJECT) || '')
        if (this.permissionObject) {
            this.permissionObject = JSON.parse(this.permissionObject)
        }
        this.imageFormats = 'image/*'
        this.mixpanelService.track('Settings My Profile Page Viewed', this.user_object)
    }

    ngOnInit(): void {
        this.store.dispatch(getProfilePictureAction(this.user_object.personId))
        this.store
            .select((state) => state.settingsReducer)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                this.isProfileLoading = res?.isProfileLoading
                if (res?.profilePicture) {
                    this.image = res?.profilePicture
                }
            })

        this.myProfileForm = new UntypedFormGroup({
            firstName: new UntypedFormControl(this.user_object['fisrtName'], [Validators.required]),
            lastName: new UntypedFormControl(this.user_object['lastName'], [Validators.required]),
            email: new UntypedFormControl(this.user_object['email'], [Validators.required, Validators.email]),
        })

        this.actions
            .pipe(ofType(SuccessUploadProfilePicture, FAILURE_UPLOAD_PROFILE_PICTURE_ACTION), takeUntilDestroyed(this.destroyRef))
            .subscribe((action: any) => {
                if (action.uploadProfilePayload?.body?.data) {
                    this.msgService.successMessage('Profile picture updated successfully')
                }
            })

        this.actions.pipe(ofType(editProfileSuccessAction, EDIT_PROFILE_FAILURE_ACTION), takeUntilDestroyed(this.destroyRef)).subscribe((action: any) => {
            if (!action.error) {
                this.user_object['fisrtName'] = this.myProfileForm.value['firstName']
                this.user_object['lastName'] = this.myProfileForm.value['lastName']
                this.user_object['fullName'] = this.myProfileForm.value['firstName'] + ' ' + this.myProfileForm.value['lastName']
                this.mixpanelService.track('Edit Profile Success', this.user_object)
                localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify(this.user_object)))
                this.msgService.successMessage('Profile updated successfully')
            } else {
                console.log('[Mixpanel test] Edit Profile Failed payload:', {
                    ...this.user_object,
                    errorMessage: action.error,
                })
                this.mixpanelService.track('Edit Profile Failed', {
                    ...this.user_object,
                    errorMessage: action.error,
                })
            }
        })
    }

    saveUser() {
        const formData = {
            id: this.user_object['personId'],
            firstName: this.myProfileForm.value['firstName'],
            lastName: this.myProfileForm.value['lastName'],
            email: this.myProfileForm.value['email'],
            username: this.myProfileForm.value['email'],
        }
        this.mixpanelService.track('Save profile button pressed', formData)

        this.store.dispatch(editProfileAction(formData))
    }

    onImageSelect() {
        let file: any = document?.getElementById('browse-btn')
        file = file.files[0]
        if (file === null || file === undefined) return

        const fReader = new FileReader()
        fReader.readAsDataURL(file)
        fReader.onloadend = (event: any) => {
            const img: any = document.getElementById('profile-pic')
            img.src = event.target.result
        }
        this.store.dispatch(
            uploadProfilePicture({
                profilePicture: file,
                personId: this.user_object.personId,
            })
        )
    }
}
