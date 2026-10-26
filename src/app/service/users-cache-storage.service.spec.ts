import { TestBed } from '@angular/core/testing'
import K from '../constants'
import Encryption from '../util/Encryption'
import { USERS_LOCAL_CACHE_FRESH_MS, USERS_LOCAL_CACHE_TTL_MS, UsersCacheStorageService } from './users-cache-storage.service'

function setUser(personId: string): void {
    localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify({ personId })))
}

describe('UsersCacheStorageService', () => {
    let service: UsersCacheStorageService
    let now: number

    beforeEach(() => {
        localStorage.clear()
        now = Date.parse('2026-01-01T00:00:00.000Z')
        spyOn(Date, 'now').and.callFake(() => now)
        TestBed.configureTestingModule({})
        service = TestBed.inject(UsersCacheStorageService)
    })

    afterEach(() => localStorage.clear())

    describe('buildKey()', () => {
        it('produces identical keys for the same payload with differently-ordered fields', () => {
            setUser('user1')
            const keyA = service.buildKey({ accountId: 'a1', page: 1, search: 'x' })
            const keyB = service.buildKey({ search: 'x', page: 1, accountId: 'a1' })
            expect(keyA).toBe(keyB)
        })

        it('produces distinct keys for distinct page/sort/search/filter/account combinations', () => {
            setUser('user1')
            const base = { accountId: 'a1', pageNumber: 1, pageSize: 10, search: '', sortBy: '', ascending: false, isTeamSearch: false }
            const keys = [
                service.buildKey(base),
                service.buildKey({ ...base, pageNumber: 2 }),
                service.buildKey({ ...base, sortBy: 'name' }),
                service.buildKey({ ...base, ascending: true }),
                service.buildKey({ ...base, search: 'john' }),
                service.buildKey({ ...base, accountId: 'a2' }),
                service.buildKey({ ...base, isTeamSearch: true }),
            ]
            expect(new Set(keys).size).toBe(keys.length)
        })
    })

    describe('get() / set()', () => {
        it('returns miss when nothing is cached', () => {
            setUser('user1')
            expect(service.get(service.buildKey({})).status).toBe('miss')
        })

        it('returns fresh for an entry younger than the fresh window', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            service.set(key, { userList: [] })
            now += USERS_LOCAL_CACHE_FRESH_MS - 1
            expect(service.get(key).status).toBe('fresh')
        })

        it('returns stale once past the fresh window but still within TTL', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            service.set(key, { userList: [] })
            now += USERS_LOCAL_CACHE_FRESH_MS + 1
            expect(service.get(key).status).toBe('stale')
        })

        it('returns miss once past the full TTL', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            service.set(key, { userList: [] })
            now += USERS_LOCAL_CACHE_TTL_MS + 1
            expect(service.get(key).status).toBe('miss')
        })

        it('returns miss for a different user even for the same key shape', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            service.set(key, { userList: [] })
            setUser('user2')
            expect(service.get(key).status).toBe('miss')
        })

        it('returns miss for a corrupted entry instead of throwing', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            localStorage.setItem(key, '{not-json')
            expect(service.get(key).status).toBe('miss')
        })
    })

    describe('setIfChanged()', () => {
        it('reports unchanged for identical data and changed when it differs', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            expect(service.setIfChanged(key, { userList: [1] })).toBe(true)
            expect(service.setIfChanged(key, { userList: [1] })).toBe(false)
            expect(service.setIfChanged(key, { userList: [2] })).toBe(true)
        })
    })

    describe('safeWrite (quota-exceeded resilience)', () => {
        it('does not throw when localStorage.setItem fails, and leaves the request effectively uncached', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError')
            expect(() => service.set(key, { userList: [] })).not.toThrow()
        })

        it('recovers once the retry-after-clear succeeds', () => {
            setUser('user1')
            const key = service.buildKey({ accountId: 'a1' })
            let callCount = 0
            const originalSetItem = localStorage.setItem.bind(localStorage)
            spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => {
                callCount++
                // Fail only on the very first attempt to simulate a full quota that clearing frees up.
                if (callCount === 1) throw new Error('QuotaExceededError')
                originalSetItem(k, v)
            })
            expect(() => service.set(key, { userList: [{ personID: 'p1' }] })).not.toThrow()
        })
    })

    describe('clear() / clearForCurrentUser() / purgeAll()', () => {
        it('removes only the given user\'s entries', () => {
            setUser('user1')
            const key1 = service.buildKey({ accountId: 'a1' })
            service.set(key1, { userList: [] })
            setUser('user2')
            const key2 = service.buildKey({ accountId: 'a1' })
            service.set(key2, { userList: [] })

            service.clear('user1')

            setUser('user1')
            expect(service.get(key1).status).toBe('miss')
            setUser('user2')
            expect(service.get(key2).data).toEqual({ userList: [] })
        })

        it('purgeAll clears every cached page for the current user', () => {
            setUser('user1')
            const keyPage1 = service.buildKey({ accountId: 'a1', pageNumber: 1 })
            const keyPage2 = service.buildKey({ accountId: 'a1', pageNumber: 2 })
            service.set(keyPage1, { userList: [] })
            service.set(keyPage2, { userList: [] })

            service.purgeAll()

            expect(service.get(keyPage1).status).toBe('miss')
            expect(service.get(keyPage2).status).toBe('miss')
        })
    })

    describe('LRU cap', () => {
        it('evicts the oldest entry once the per-user cap is exceeded', () => {
            setUser('user1')
            const keys: string[] = []
            for (let i = 0; i < 31; i++) {
                const key = service.buildKey({ accountId: 'a1', pageNumber: i })
                keys.push(key)
                service.set(key, { userList: [] })
                now += 1000 // distinct timestamps so eviction order is deterministic
            }
            // The very first (oldest) entry should have been evicted to stay at the 30-entry cap.
            expect(service.get(keys[0]).status).toBe('miss')
            // The most recent entry must still be present.
            expect(service.get(keys[30]).status).not.toBe('miss')
        })
    })

    // What's actually cached is the raw HttpResponse-shaped object returned by
    // getUsersListCall (see main-users-list.reducer.ts's `usersListResponse?.body?.data` read) -
    // NOT a flat { userList: [...] } object. Using the real shape here matters: an earlier
    // version of these tests used a flat shape that happened to match the (buggy) implementation
    // instead of the real API contract, so the tests passed while removeUserFromAllCachedPages
    // was silently a no-op in production.
    function usersListResponse(userList: any[], noOfPage = 1) {
        return { body: { data: { userList, noOfPage } } }
    }

    function cachedUserList(result: { data?: any }): any[] | undefined {
        return result.data?.body?.data?.userList
    }

    describe('per-account LRU budget isolation', () => {
        it('does not let one account\'s pages evict another account\'s pages out of the shared cap', () => {
            setUser('user1')

            const acct1Keys: string[] = []
            for (let i = 0; i < 30; i++) {
                const key = service.buildKey({ accountId: 'a1', pageNumber: i })
                acct1Keys.push(key)
                service.set(key, { userList: [] }, 'a1')
                now += 1000
            }

            // Account 2 fills its own 30-entry budget too - must not evict any of account 1's
            // entries, which live in a separate per-account index.
            for (let i = 0; i < 30; i++) {
                const key = service.buildKey({ accountId: 'a2', pageNumber: i })
                service.set(key, { userList: [] }, 'a2')
                now += 1000
            }

            acct1Keys.forEach((key) => expect(service.get(key).status).not.toBe('miss'))
        })
    })

    describe('removeUserFromAllCachedPages()', () => {
        it('removes the participant from every cached page of the matching account, leaving others untouched', () => {
            setUser('user1')
            const accountId = 'a1'
            const otherAccountId = 'a2'
            const personId = 'p1'

            const page1Key = service.buildKey({ accountId, pageNumber: 1 })
            const page2Key = service.buildKey({ accountId, pageNumber: 2 })
            const otherAccountKey = service.buildKey({ accountId: otherAccountId, pageNumber: 1 })

            // Cache writes must carry the accountId for scoping to work - simulates what the
            // effect's SwrCache adapter does via setIfChanged(key, data, accountId).
            service.set(page1Key, usersListResponse([{ personID: personId }, { personID: 'p2' }]), accountId)
            service.set(page2Key, usersListResponse([{ personID: personId }]), accountId)
            // Same participant, different account - must survive untouched.
            service.set(otherAccountKey, usersListResponse([{ personID: personId }]), otherAccountId)

            service.removeUserFromAllCachedPages(accountId, personId)

            expect(cachedUserList(service.get(page1Key))).toEqual([{ personID: 'p2' }])
            expect(cachedUserList(service.get(page2Key))).toEqual([])
            expect(cachedUserList(service.get(otherAccountKey))).toEqual([{ personID: personId }])
        })

        it('preserves sibling fields on the cached response (e.g. noOfPage) when patching userList', () => {
            setUser('user1')
            const accountId = 'a1'
            const personId = 'p1'
            const key = service.buildKey({ accountId, pageNumber: 1 })
            service.set(key, usersListResponse([{ personID: personId }, { personID: 'p2' }], 5), accountId)

            service.removeUserFromAllCachedPages(accountId, personId)

            const result = service.get<any>(key)
            expect(result.data?.body?.data?.noOfPage).toBe(5)
            expect(cachedUserList(result)).toEqual([{ personID: 'p2' }])
        })

        it('marks a patched entry stale rather than fresh, but not a hard miss', () => {
            setUser('user1')
            const accountId = 'a1'
            const personId = 'p1'
            const key = service.buildKey({ accountId, pageNumber: 1 })
            service.set(key, usersListResponse([{ personID: personId }]), accountId)

            service.removeUserFromAllCachedPages(accountId, personId)

            expect(service.get(key).status).toBe('stale')
        })

        it('does not touch entries written without an accountId (pre-existing/legacy entries)', () => {
            setUser('user1')
            const personId = 'p1'
            const key = service.buildKey({ pageNumber: 1 })
            service.set(key, usersListResponse([{ personID: personId }])) // no accountId argument

            service.removeUserFromAllCachedPages('a1', personId)

            expect(cachedUserList(service.get(key))).toEqual([{ personID: personId }])
        })

        it('is a no-op when the participant is not present in any cached page', () => {
            setUser('user1')
            const accountId = 'a1'
            const key = service.buildKey({ accountId, pageNumber: 1 })
            service.set(key, usersListResponse([{ personID: 'someone-else' }]), accountId)

            expect(() => service.removeUserFromAllCachedPages(accountId, 'p1')).not.toThrow()
            expect(cachedUserList(service.get(key))).toEqual([{ personID: 'someone-else' }])
        })

        it('is a no-op when there is nothing cached for the user at all', () => {
            setUser('user1')
            expect(() => service.removeUserFromAllCachedPages('a1', 'p1')).not.toThrow()
        })

        it('does nothing when accountId or personId is missing', () => {
            setUser('user1')
            const accountId = 'a1'
            const personId = 'p1'
            const key = service.buildKey({ accountId, pageNumber: 1 })
            service.set(key, usersListResponse([{ personID: personId }]), accountId)

            service.removeUserFromAllCachedPages('', personId)
            service.removeUserFromAllCachedPages(accountId, '')

            expect(cachedUserList(service.get(key))).toEqual([{ personID: personId }])
        })
    })
})
