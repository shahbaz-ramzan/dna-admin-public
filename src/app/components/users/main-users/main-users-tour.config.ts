export interface MainUsersTourCallbacks {
    next: () => void
    onDigitalScanStepNext: () => void
}

export function buildMainUsersTourSteps(callbacks: MainUsersTourCallbacks): any[] {
    return [
        {
            id: 'digital-scan-step',
            title: 'Digital Scan',
            text: `Click here to begin the scan. We'll walk you through filling out the details.​`,
            attachTo: {
                element: '#digital-scan-btn',
                on: 'bottom',
            },
            buttons: [
                {
                    text: 'Next',
                    action: () => callbacks.onDigitalScanStepNext(),
                    classes: 'btn btn-primary tour-next-btn',
                },
            ],
            when: {
                show: () => {
                    const scanBtn = document.getElementById('digital-scan-btn')
                    if (!scanBtn || scanBtn.style.display === 'none') {
                        callbacks.next()
                    }
                },
            },
        },
    ]
}
