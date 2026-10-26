const HIGHLIGHT_CLASS = 'tour-highlight'

export function highlightElement(elementId: string): void {
    removeHighlights()
    const el = document.querySelector(`#${elementId}`) as HTMLElement
    if (el) {
        el.classList.add(HIGHLIGHT_CLASS)
        el.style.cssText += `
            position: relative !important;
            z-index: 10000 !important;
            border: 2px solid #007bff !important;
            border-radius: 4px !important;
            box-shadow: 0 0 15px rgba(0, 123, 255, 0.5) !important;
            transition: all 0.3s ease !important;
        `
    }
}

export function removeHighlights(): void {
    const highlighted = document.querySelectorAll(`.${HIGHLIGHT_CLASS}`)
    highlighted.forEach((element) => {
        element.classList.remove(HIGHLIGHT_CLASS)
        const htmlElement = element as HTMLElement
        htmlElement.style.removeProperty('background-color')
        htmlElement.style.removeProperty('border')
        htmlElement.style.removeProperty('border-radius')
        htmlElement.style.removeProperty('box-shadow')
        htmlElement.style.removeProperty('z-index')
        htmlElement.style.removeProperty('position')
        htmlElement.style.removeProperty('transition')
    })
}

export interface SettingsTourCallbacks {
    onSkip: () => void
    onFinish: () => void
}

function getSkipButton(callbacks: SettingsTourCallbacks) {
    return {
        text: 'Skip',
        action: () => callbacks.onSkip(),
        classes: 'btn btn-outline-secondary',
    }
}

function getNextButton() {
    return {
        text: 'Next',
        type: 'next',
        classes: 'btn btn-primary',
    }
}

function getPreviousButton() {
    return {
        text: 'Back',
        type: 'back',
        classes: 'btn btn-secondary',
    }
}

export function buildSettingsTourSteps(callbacks: SettingsTourCallbacks): any[] {
    return [
        // Step 1: Account Settings
        {
            title: 'Account Settings',
            text: 'Manage your account information, billing details, and general account preferences. Update your organization name and other basic account settings here.',
            attachTo: {
                element: '#settings-account',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getNextButton()],
            id: 'account-step',
            when: {
                show: () => highlightElement('settings-account'),
                hide: () => removeHighlights(),
            },
        },
        // Step 2: Profile Settings
        {
            title: 'Profile Settings',
            text: 'Update your personal profile information including name, contact details, and profile picture. This information is used across the platform.',
            attachTo: {
                element: '#settings-profile',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getPreviousButton(), getNextButton()],
            id: 'profile-step',
            when: {
                show: () => highlightElement('settings-profile'),
                hide: () => removeHighlights(),
            },
        },
        // Step 3: Self Registration
        {
            title: 'Self Registration',
            text: 'Configure self-registration settings for participants. Set up registration links, customize the registration process, and manage participant onboarding.',
            attachTo: {
                element: '#settings-registration',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getPreviousButton(), getNextButton()],
            id: 'registration-step',
            when: {
                show: () => highlightElement('settings-registration'),
                hide: () => removeHighlights(),
            },
        },
        // Step 4: Subscriptions
        {
            title: 'Subscriptions',
            text: 'Manage your subscription plans, billing information, and feature access. View your current plan details and upgrade options.',
            attachTo: {
                element: '#settings-subscriptions',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getPreviousButton(), getNextButton()],
            id: 'subscriptions-step',
            when: {
                show: () => highlightElement('settings-subscriptions'),
                hide: () => removeHighlights(),
            },
        },
        // Step 5: Add Admins
        {
            title: 'Add Admins',
            text: 'Invite and manage administrative users for your account. Set permissions and roles for team members who need access to admin features.',
            attachTo: {
                element: '#settings-admins',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getPreviousButton(), getNextButton()],
            id: 'admins-step',
            when: {
                show: () => highlightElement('settings-admins'),
                hide: () => removeHighlights(),
            },
        },
        // Step 6: Reports & Customization
        {
            title: 'Reports & Customization',
            text: 'Customize report templates, branding, and visual elements. Configure how reports are generated and presented to participants.',
            attachTo: {
                element: '#settings-reports',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getPreviousButton(), getNextButton()],
            id: 'reports-step',
            when: {
                show: () => highlightElement('settings-reports'),
                hide: () => removeHighlights(),
            },
        },
        // Step 7: Email Settings
        {
            title: 'Email Settings',
            text: 'Configure email notifications, templates, and communication preferences. Set up automated emails and customize messaging for participants.',
            attachTo: {
                element: '#settings-email',
                on: 'right',
            },
            buttons: [getSkipButton(callbacks), getPreviousButton(), getNextButton()],
            id: 'email-step',
            when: {
                show: () => highlightElement('settings-email'),
                hide: () => removeHighlights(),
            },
        },
        // Step 8: Integrations
        {
            title: 'Integrations',
            text: 'Connect with third-party tools and platforms. Set up webhooks, API integrations, and data synchronization with external systems.',
            attachTo: {
                element: '#settings-integrations',
                on: 'right',
            },
            buttons: [
                getSkipButton(callbacks),
                getPreviousButton(),
                {
                    text: 'Finish',
                    action: () => callbacks.onFinish(),
                    classes: 'btn btn-success',
                },
            ],
            id: 'integrations-step',
            when: {
                show: () => highlightElement('settings-integrations'),
                hide: () => removeHighlights(),
            },
        },
    ]
}
