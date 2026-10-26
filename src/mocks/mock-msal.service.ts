export class MockMsalService {
    login() {
        return 'logged in success'
    }

    get loginInProgress() {
        return true
    }
}
