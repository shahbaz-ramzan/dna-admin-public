import { TestBed } from '@angular/core/testing'
import K from '../constants'
import Encryption from '../util/Encryption'
import { DASHBOARD_LOCAL_CACHE_TTL_MS, DashboardCacheStorageService } from './dashboard-cache-storage.service'

function setUser(personId: string): void {
    localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify({ personId })))
}

describe('DashboardCacheStorageService', () => {
    let service: DashboardCacheStorageService
    let now: number

    beforeEach(() => {
        localStorage.clear()
        now = Date.parse('2026-01-01T00:00:00.000Z')
        spyOn(Date, 'now').and.callFake(() => now)
        TestBed.configureTestingModule({})
        service = TestBed.inject(DashboardCacheStorageService)
    })

    afterEach(() => localStorage.clear())

    describe('get()', () => {
        it('returns miss when no user is resolvable', () => {
            expect(service.get('widgetA').status).toBe('miss')
        })

        it('returns miss when nothing is cached for the user', () => {
            setUser('user1')
            expect(service.get('widgetA').status).toBe('miss')
        })

        it('returns fresh for an entry younger than half the TTL', () => {
            setUser('user1')
            service.set('widgetA', { value: 1 })
            now += DASHBOARD_LOCAL_CACHE_TTL_MS / 4
            const result = service.get<{ value: number }>('widgetA')
            expect(result.status).toBe('fresh')
            expect(result.data).toEqual({ value: 1 })
        })

        it('returns stale for an entry older than half the TTL but still within it', () => {
            setUser('user1')
            service.set('widgetA', { value: 1 })
            now += DASHBOARD_LOCAL_CACHE_TTL_MS * 0.75
            expect(service.get('widgetA').status).toBe('stale')
        })

        it('returns miss once the entry is older than the TTL', () => {
            setUser('user1')
            service.set('widgetA', { value: 1 })
            now += DASHBOARD_LOCAL_CACHE_TTL_MS + 1
            expect(service.get('widgetA').status).toBe('miss')
        })

        it('returns miss for a different user even if a value is cached for the current key shape', () => {
            setUser('user1')
            service.set('widgetA', { value: 1 })
            setUser('user2')
            expect(service.get('widgetA').status).toBe('miss')
        })

        it('does not leak one user\'s data into another user\'s read of the same widget key', () => {
            setUser('user1')
            service.set('widgetA', { value: 'user1-data' })
            setUser('user2')
            service.set('widgetA', { value: 'user2-data' })
            expect(service.get<{ value: string }>('widgetA').data).toEqual({ value: 'user2-data' })
            setUser('user1')
            expect(service.get<{ value: string }>('widgetA').data).toEqual({ value: 'user1-data' })
        })

        it('returns miss for a corrupted cache entry instead of throwing', () => {
            setUser('user1')
            localStorage.setItem('dashboard:user1:widgetA', '{not-json')
            expect(service.get('widgetA').status).toBe('miss')
        })
    })

    describe('setIfChanged()', () => {
        it('reports changed and writes on first write', () => {
            setUser('user1')
            expect(service.setIfChanged('widgetA', { value: 1 })).toBe(true)
            expect(service.get('widgetA').data).toEqual({ value: 1 })
        })

        it('reports unchanged when writing identical data again', () => {
            setUser('user1')
            service.setIfChanged('widgetA', { value: 1 })
            expect(service.setIfChanged('widgetA', { value: 1 })).toBe(false)
        })

        it('reports changed when the new data differs', () => {
            setUser('user1')
            service.setIfChanged('widgetA', { value: 1 })
            expect(service.setIfChanged('widgetA', { value: 2 })).toBe(true)
            expect(service.get('widgetA').data).toEqual({ value: 2 })
        })

        it('refreshes the TTL clock even when the data is unchanged', () => {
            setUser('user1')
            service.setIfChanged('widgetA', { value: 1 })
            now += DASHBOARD_LOCAL_CACHE_TTL_MS * 0.75
            service.setIfChanged('widgetA', { value: 1 })
            // Still within a fresh TTL window measured from the second (no-op) write.
            expect(service.get('widgetA').status).toBe('fresh')
        })

        it('treats a corrupted existing entry as changed and overwrites it', () => {
            setUser('user1')
            localStorage.setItem('dashboard:user1:widgetA', '{not-json')
            expect(service.setIfChanged('widgetA', { value: 1 })).toBe(true)
            expect(service.get('widgetA').data).toEqual({ value: 1 })
        })
    })

    describe('clear() / clearForCurrentUser()', () => {
        it('removes only the given user\'s entries', () => {
            setUser('user1')
            service.set('widgetA', { value: 1 })
            service.set('widgetB', { value: 2 })
            setUser('user2')
            service.set('widgetA', { value: 3 })

            service.clear('user1')

            setUser('user1')
            expect(service.get('widgetA').status).toBe('miss')
            expect(service.get('widgetB').status).toBe('miss')
            setUser('user2')
            expect(service.get('widgetA').data).toEqual({ value: 3 })
        })

        it('clearForCurrentUser resolves the active user before clearing', () => {
            setUser('user1')
            service.set('widgetA', { value: 1 })
            service.clearForCurrentUser()
            expect(service.get('widgetA').status).toBe('miss')
        })
    })
})
