const HIGHLIGHT_CLASS = 'tour-highlight'

export function highlightElement(selector: string, options?: { skipPositioning?: boolean }): void {
    removeHighlights()
    const el = document.querySelector(selector) as HTMLElement
    if (el) {
        el.classList.add(HIGHLIGHT_CLASS)
        const computedPos = window.getComputedStyle(el).position
        const shouldSkipPositioning = options?.skipPositioning || computedPos === 'fixed'
        if (!shouldSkipPositioning) {
            el.style.cssText += `
                position: relative !important;
                z-index: 10000 !important;
            `
            el.setAttribute('data-home-tour-pos', '1')
            el.setAttribute('data-home-tour-z', '1')
        }
        const borderCss = ''
        el.style.cssText += `
            ${borderCss}
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
        htmlElement.style.removeProperty('border')
        htmlElement.style.removeProperty('border-radius')
        htmlElement.style.removeProperty('box-shadow')
        htmlElement.style.removeProperty('transition')
        // Only remove position/z-index if we added them
        if (htmlElement.getAttribute('data-home-tour-pos')) {
            htmlElement.style.removeProperty('position')
            htmlElement.removeAttribute('data-home-tour-pos')
        }
        if (htmlElement.getAttribute('data-home-tour-z')) {
            htmlElement.style.removeProperty('z-index')
            htmlElement.removeAttribute('data-home-tour-z')
        }
    })
}

export interface HomeTourCallbacks {
    next: () => void
    complete: () => void
}

export function buildHomeTourSteps(callbacks: HomeTourCallbacks): any[] {
    return [
        {
            id: 'switch-account-step',
            title: 'Account Switcher',
            text: "Click the dropdown next to your company logo in the top left to switch between accounts you have access to. If you only have one—you'll just see your organization here.",
            attachTo: { element: '#switch-account', on: 'right' },
            buttons: [{ text: 'Next', type: 'next', classes: 'btn btn-primary tour-next-btn' }],
            when: {
                show: () => {
                    const el = document.querySelector('#switch-account')
                    if (!el) {
                        callbacks.next()
                        return
                    }
                    highlightElement('#switch-account')
                },
                hide: () => removeHighlights(),
            },
        },
        {
            id: 'dashboard-nav-step',
            title: 'Your Dashboard',
            text: "This is where you see a quick snapshot of your account: your team's styles, market mood, recent activity, and key analytics—all in one place.",
            attachTo: { element: 'p-menubar .p-menuitem:nth-child(1)', on: 'bottom' },
            buttons: [
                {
                    text: '<i class="pi pi-chevron-left"></i> Back',
                    type: 'back',
                    classes: 'btn btn-secondary back-btn tour-back-btn',
                },
                { text: 'Next', type: 'next', classes: 'btn btn-primary tour-next-btn' },
            ],
            when: {
                show: () => {
                    const el = document.querySelector('p-menubar .p-menuitem:nth-child(1)')
                    if (!el) {
                        callbacks.next()
                        return
                    }
                    highlightElement('p-menubar .p-menuitem:nth-child(1)')
                },
                hide: () => removeHighlights(),
            },
        },
        {
            id: 'users-nav-step',
            title: 'Manage Your Clients',
            text: `Find all your clients' profiles, generate reports, and run Digital Scans. All your client insights live here.`,
            attachTo: { element: 'p-menubar .p-menuitem:nth-child(2)', on: 'bottom' },
            buttons: [
                {
                    text: '<i class="pi pi-chevron-left"></i> Back',
                    type: 'back',
                    classes: 'btn btn-secondary back-btn tour-back-btn',
                },
                { text: 'Next', type: 'next', classes: 'btn btn-primary tour-next-btn' },
            ],
            when: {
                show: () => {
                    const el = document.querySelector('p-menubar .p-menuitem:nth-child(2)')
                    if (!el) {
                        callbacks.next()
                        return
                    }
                    highlightElement('p-menubar .p-menuitem:nth-child(2)')
                },
                hide: () => removeHighlights(),
            },
        },
        {
            id: 'myteam-nav-step',
            title: 'Your Team, All in One Place',
            text: 'View everyone at your company with access to DNA Behavior. Add, manage, or remove team members as needed.',
            attachTo: { element: 'p-menubar .p-menuitem:nth-child(3)', on: 'bottom' },
            buttons: [
                {
                    text: '<i class="pi pi-chevron-left"></i> Back',
                    type: 'back',
                    classes: 'btn btn-secondary back-btn tour-back-btn',
                },
                { text: 'Next', type: 'next', classes: 'btn btn-primary tour-next-btn' },
            ],
            when: {
                show: () => {
                    const el = document.querySelector('p-menubar .p-menuitem:nth-child(3)')
                    if (!el) {
                        callbacks.next()
                        return
                    }
                    highlightElement('p-menubar .p-menuitem:nth-child(3)')
                },
                hide: () => removeHighlights(),
            },
        },
        {
            id: 'settings-nav-step',
            title: 'Make It Yours',
            text: 'Edit your account details, update payment info, add admins, upload your logo, and tweak email, report, and integration settings to fit your workflow.',
            attachTo: { element: 'p-menubar .p-menuitem:nth-child(4)', on: 'bottom' },
            buttons: [
                {
                    text: '<i class="pi pi-chevron-left"></i> Back',
                    type: 'back',
                    classes: 'btn btn-secondary back-btn tour-back-btn',
                },
                { text: 'Next', type: 'next', classes: 'btn btn-primary tour-next-btn' },
            ],
            when: {
                show: () => {
                    const el = document.querySelector('p-menubar .p-menuitem:nth-child(4)')
                    if (!el) {
                        callbacks.next()
                        return
                    }
                    highlightElement('p-menubar .p-menuitem:nth-child(4)')
                },
                hide: () => removeHighlights(),
            },
        },
        {
            id: 'help-icon-step',
            title: 'Need Help?',
            text: `Click the "?" icon at the top right to contact support, access the help center, give feedback, or retake this app tour any time.`,
            attachTo: { element: '#nav-help-icon', on: 'left' },
            buttons: [
                {
                    text: '<i class="pi pi-chevron-left"></i> Back',
                    type: 'back',
                    classes: 'btn btn-secondary back-btn tour-back-btn',
                },
                { text: 'Next', type: 'next', classes: 'btn btn-primary tour-next-btn' },
            ],
            when: {
                show: () => {
                    const el = document.querySelector('#nav-help-icon')
                    if (!el) {
                        callbacks.next()
                        return
                    }
                    highlightElement('#nav-help-icon')
                },
                hide: () => removeHighlights(),
            },
        },
        {
            id: 'wonderchat-step',
            title: 'Meet Gene, Your AI Assistant',
            text: 'Got questions or need quick help? Just ask Gene—our built-in AI assistant—any time. Gene can guide you, explain features, or help you get more from the app.',
            // The Wonderchat launcher is injected by their script. Prefer targeting the fixed button to avoid layout shifts.
            attachTo: { element: '#wonderchat-wrapper', on: 'left' },
            buttons: [
                {
                    text: '<i class="pi pi-chevron-left"></i> Back',
                    type: 'back',
                    classes: 'btn btn-secondary back-btn tour-back-btn',
                },
                {
                    text: 'Finish Tour',
                    action: () => {
                        window.dispatchEvent(new CustomEvent('open-nav-video-modal', { detail: { mode: 'finish' } }))
                        callbacks.complete()
                    },
                    classes: 'btn btn-primary tour-next-btn',
                },
            ],
            when: {
                show: () => {
                    // Try a series of selectors to find the fixed button/launcher
                    const selectors = ['#wonderchat-wrapper']
                    const found = selectors.find((s) => !!document.querySelector(s))
                    if (!found) {
                        callbacks.next()
                        return
                    }
                    // Skip positioning overrides for fixed elements to avoid pushing to the footer
                    const el = document.querySelector(found) as HTMLElement
                    const isFixed = el && window.getComputedStyle(el).position === 'fixed'
                    highlightElement(found, { skipPositioning: isFixed })
                },
                hide: () => removeHighlights(),
            },
            scrollTo: false,
        },
    ]
}
