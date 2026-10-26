import { Injectable } from '@angular/core'
import { forkJoin, Observable } from 'rxjs'
import K from 'src/app/constants'
import { MainUsersService } from '../../main-users.service'

@Injectable({ providedIn: 'root' })
export class TeamReportDataService {
    constructor(private mainUsersService: MainUsersService) {}

    getAllResponses(selectedParticipantIds: any[], accountId: string | null): Observable<any[]> {
        const responses: any[] = []
        responses.push(this.getDetailsOfAllParticipants(selectedParticipantIds, accountId))
        responses.push(this.getWorkTalentOfAllParticipants(selectedParticipantIds))
        responses.push(this.getTScoreOfAllParticipants(selectedParticipantIds))
        responses.push(this.getEnvironmentKeysOfAllParticipants(selectedParticipantIds))
        responses.push(this.getUniqueStyleAndDescriptionOfAllParticipants(selectedParticipantIds))
        return forkJoin(responses)
    }

    private getTScoreOfAllParticipants(selectedParticipantIds: any[]): Observable<any[]> {
        const responses: any[] = []
        selectedParticipantIds.forEach((personId) => {
            responses.push(this.mainUsersService.getTScoreCall(personId))
        })
        return forkJoin(responses)
    }

    private getWorkTalentOfAllParticipants(selectedParticipantIds: any[]): Observable<any[]> {
        const responses: any[] = []
        selectedParticipantIds.forEach((personId) => {
            responses.push(this.mainUsersService.getWorkTalentsCall(personId, K.APP.LANGUAGE_ID))
        })
        return forkJoin(responses)
    }

    private getEnvironmentKeysOfAllParticipants(selectedParticipantIds: any[]): Observable<any[]> {
        const responses: any[] = []
        selectedParticipantIds.forEach((personId) => {
            responses.push(this.mainUsersService.getEnvironmentKeysCall(personId, K.APP.LANGUAGE_ID))
        })
        return forkJoin(responses)
    }

    private getUniqueStyleAndDescriptionOfAllParticipants(selectedParticipantIds: any[]): Observable<any[]> {
        const responses: any[] = []
        selectedParticipantIds.forEach((personId) => {
            responses.push(this.mainUsersService.getUniqueStyleAndDescriptionCall(personId, K.APP.LANGUAGE_ID))
        })
        return forkJoin(responses)
    }

    private getDetailsOfAllParticipants(selectedParticipantIds: any[], accountId: string | null): Observable<any[]> {
        const responses: any[] = []
        const participantsList = selectedParticipantIds.map((item: any) => {
            return {
                personId: item,
            }
        })
        responses.push(
            this.mainUsersService.getParticipantsDetail({
                participants: participantsList,
                accountId: accountId,
            })
        )
        return forkJoin(responses)
    }
}
