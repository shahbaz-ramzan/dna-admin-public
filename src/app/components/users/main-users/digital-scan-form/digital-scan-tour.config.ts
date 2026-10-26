export interface DigitalScanTourCallbacks {
    onFinish: () => void
}

export function buildDigitalScanTourSteps(callbacks: DigitalScanTourCallbacks): any[] {
    return [
        // Step 1: Personal Information
        {
            title: 'Fill out the form​',
            text: `Enter the client's information in this form to begin a scan​`,
            attachTo: {
                element: '#client-scan-form',
                on: 'right',
            },
            buttons: [
                {
                    text: 'Next',
                    type: 'next',
                    classes: 'btn btn-primary tour-next-btn',
                },
            ],
            id: 'personal-info-step',
        },
        // Step 2: Advisor Selection
        {
            title: 'Select an advisor​',
            text: `Select an advisor who you would like to assign to this client​`,
            attachTo: {
                element: '#dropdown',
                on: 'bottom',
            },
            buttons: [
                { text: '<i class="pi pi-chevron-left"></i> Back', type: 'back', classes: 'btn btn-secondary back-btn tour-back-btn' },
                {
                    text: 'Next',
                    type: 'next',
                    classes: 'btn btn-primary tour-next-btn',
                },
            ],
            id: 'advisor-step',
        },
        // Step 3: Tags Selection
        {
            title: 'Select a tag​',
            text: `Once you are done filling out the client's information above, select a tag to begin the scan​`,
            attachTo: {
                element: '#tags-selection',
                on: 'top',
            },
            buttons: [
                { text: '<i class="pi pi-chevron-left"></i> Back', type: 'back', classes: 'btn btn-secondary back-btn tour-back-btn' },
                {
                    text: 'Next',
                    type: 'next',
                    classes: 'btn btn-primary tour-next-btn',
                },
            ],
            id: 'tags-step',
        },
        // Step 4: Submit Button (Changed to Next instead of Finish)
        {
            title: 'Submit the form​',
            text: `Click to generate the behavior scan. It'll be ready in under a minute​​`,
            attachTo: {
                element: 'button[type="submit"]',
                on: 'top',
            },
            buttons: [
                { text: '<i class="pi pi-chevron-left"></i> Back', type: 'back', classes: 'btn btn-secondary back-btn tour-back-btn' },
                {
                    text: 'Finish Tour',
                    action: () => callbacks.onFinish(),
                    classes: 'btn btn-primary tour-next-btn',
                },
            ],
            id: 'submit-step',
        },
    ]
}
