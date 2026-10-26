import { TestBed } from '@angular/core/testing'
import K from '../constants'
import Encryption from '../util/Encryption'
import {
    SETTINGS_LOCAL_CACHE_FRESH_MS,
    SETTINGS_LOCAL_CACHE_TTL_MS,
    SettingsCacheStorageService,
} from './settings-cache-storage.service'

function setUser(personId: string): void {
    localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify({ personId })))
}

describe('SettingsCacheStorageService', () => {
    let service: SettingsCacheStorageService
    let now: number

    beforeEach(() => {
        localStorage.clear()
        now = Date.parse('2026-01-01T00:00:00.000Z')
        spyOn(Date, 'now').and.callFake(() => now)
        TestBed.configureTestingModule({})
        service = TestBed.inject(SettingsCacheStorageService)
    })

    afterEach(() => localStorage.clear())

    describe('buildKey()', () => {
        it('produces distinct keys for distinct scopes, accounts, and variants', () => {
            setUser('user1')
            const keys = [
                service.buildKey('legalText', 'a1'),
                service.buildKey('legalText', 'a2'),
                service.buildKey('manageTags', 'a1'),
                service.buildKey('users', 'a1', { status: 'active' }),
                service.buildKey('users', 'a1', { status: 'inactive' }),
                service.buildKey('language'), // global/account-less
            ]
            expect(new Set(keys).size).toBe(keys.length)
        })

        it('produces identical keys for the same scope/account/variant regardless of variant field order', () => {
            setUser('user1')
            const keyA = service.buildKey('userRole', 'a1', { personId: 'p1', status: 'active' })
            const keyB = service.buildKey('userRole', 'a1', { status: 'active', personId: 'p1' })
            expect(keyA).toBe(keyB)
        })

        it('does not let one scope name accidentally prefix-collide with another for purgeScopes', () => {
            setUser('user1')
            const userKey = service.buildKey('user', 'a1')
            const userRoleKey = service.buildKey('userRole', 'a1')
            expect(userKey).not.toBe(userRoleKey)
        })
    })

    describe('get() / set()', () => {
        it('returns miss when nothing is cached', () => {
            setUser('user1')
            expect(service.get(service.buildKey('legalText', 'a1')).status).toBe('miss')
        })

        it('returns fresh for an entry younger than the fresh window', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            service.set(key, { text: 'hello' }, 'a1')
            now += SETTINGS_LOCAL_CACHE_FRESH_MS - 1
            expect(service.get(key).status).toBe('fresh')
        })

        it('returns stale once past the fresh window but still within TTL', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            service.set(key, { text: 'hello' }, 'a1')
            now += SETTINGS_LOCAL_CACHE_FRESH_MS + 1
            expect(service.get(key).status).toBe('stale')
        })

        it('returns miss once past the full TTL', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            service.set(key, { text: 'hello' }, 'a1')
            now += SETTINGS_LOCAL_CACHE_TTL_MS + 1
            expect(service.get(key).status).toBe('miss')
        })

        it('respects a custom ttl/fresh window when provided', () => {
            setUser('user1')
            const key = service.buildKey('language')
            service.set(key, { code: 'en' })
            now += SETTINGS_LOCAL_CACHE_FRESH_MS + 1
            // Under the default window this would already be stale; under a longer static window it's still fresh.
            expect(service.get(key, { ttlMs: 24 * 60 * 60 * 1000, freshMs: 60 * 60 * 1000 }).status).toBe('fresh')
        })

        it('returns miss for a different user even for the same key shape', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            service.set(key, { text: 'hello' }, 'a1')
            setUser('user2')
            expect(service.get(key).status).toBe('miss')
        })

        it('returns miss for a corrupted entry instead of throwing', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            localStorage.setItem(key, '{not-json')
            expect(service.get(key).status).toBe('miss')
        })
    })

    describe('setIfChanged()', () => {
        it('reports unchanged for identical data and changed when it differs', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            expect(service.setIfChanged(key, { text: 'a' }, 'a1')).toBe(true)
            expect(service.setIfChanged(key, { text: 'a' }, 'a1')).toBe(false)
            expect(service.setIfChanged(key, { text: 'b' }, 'a1')).toBe(true)
        })
    })

    describe('scopedTo()', () => {
        it('binds accountId so callers do not need to pass it on every setIfChanged', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            const cache = service.scopedTo('a1')
            expect(cache.setIfChanged(key, { text: 'a' })).toBe(true)
            expect(cache.get<any>(key).data).toEqual({ text: 'a' })
        })
    })

    describe('safeWrite (quota-exceeded resilience)', () => {
        it('does not throw when localStorage.setItem fails, and leaves the request effectively uncached', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError')
            expect(() => service.set(key, { text: 'a' }, 'a1')).not.toThrow()
        })

        it('recovers once the retry-after-clear succeeds', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            let callCount = 0
            const originalSetItem = localStorage.setItem.bind(localStorage)
            spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => {
                callCount++
                if (callCount === 1) throw new Error('QuotaExceededError')
                originalSetItem(k, v)
            })
            expect(() => service.set(key, { text: 'a' }, 'a1')).not.toThrow()
        })
    })

    describe('clear() / clearForCurrentUser()', () => {
        it('removes only the given user\'s entries', () => {
            setUser('user1')
            const key1 = service.buildKey('legalText', 'a1')
            service.set(key1, { text: 'a' }, 'a1')
            setUser('user2')
            const key2 = service.buildKey('legalText', 'a1')
            service.set(key2, { text: 'b' }, 'a1')

            service.clear('user1')

            setUser('user1')
            expect(service.get(key1).status).toBe('miss')
            setUser('user2')
            expect(service.get(key2).data).toEqual({ text: 'b' })
        })
    })

    describe('purgeAccount()', () => {
        it('clears every scope for one account without touching another account', () => {
            setUser('user1')
            const a1LegalText = service.buildKey('legalText', 'a1')
            const a1Tags = service.buildKey('manageTags', 'a1')
            const a2LegalText = service.buildKey('legalText', 'a2')
            service.set(a1LegalText, { text: 'a' }, 'a1')
            service.set(a1Tags, { tags: [] }, 'a1')
            service.set(a2LegalText, { text: 'b' }, 'a2')

            service.purgeAccount('a1')

            expect(service.get(a1LegalText).status).toBe('miss')
            expect(service.get(a1Tags).status).toBe('miss')
            expect(service.get(a2LegalText).status).not.toBe('miss')
        })
    })

    describe('purgeScopes()', () => {
        it('clears only the named scopes (and all their variants) for the given account', () => {
            setUser('user1')
            const tagsKey = service.buildKey('manageTags', 'a1')
            const legalKey = service.buildKey('legalText', 'a1')
            const usersActive = service.buildKey('users', 'a1', { status: 'active' })
            const usersInactive = service.buildKey('users', 'a1', { status: 'inactive' })
            service.set(tagsKey, { tags: [] }, 'a1')
            service.set(legalKey, { text: 'a' }, 'a1')
            service.set(usersActive, { list: [] }, 'a1')
            service.set(usersInactive, { list: [] }, 'a1')

            service.purgeScopes('a1', ['manageTags', 'users'])

            expect(service.get(tagsKey).status).toBe('miss')
            expect(service.get(usersActive).status).toBe('miss')
            expect(service.get(usersInactive).status).toBe('miss')
            expect(service.get(legalKey).status).not.toBe('miss')
        })

        it('does not evict a different account\'s same-scope entry', () => {
            setUser('user1')
            const a1Tags = service.buildKey('manageTags', 'a1')
            const a2Tags = service.buildKey('manageTags', 'a2')
            service.set(a1Tags, { tags: [] }, 'a1')
            service.set(a2Tags, { tags: [] }, 'a2')

            service.purgeScopes('a1', ['manageTags'])

            expect(service.get(a1Tags).status).toBe('miss')
            expect(service.get(a2Tags).status).not.toBe('miss')
        })

        it('is a no-op for an empty scopes array', () => {
            setUser('user1')
            const key = service.buildKey('legalText', 'a1')
            service.set(key, { text: 'a' }, 'a1')
            expect(() => service.purgeScopes('a1', [])).not.toThrow()
            expect(service.get(key).status).not.toBe('miss')
        })
    })

    describe('LRU cap', () => {
        it('evicts the oldest entry once the per-account cap is exceeded', () => {
            setUser('user1')
            const keys: string[] = []
            for (let i = 0; i < 41; i++) {
                const key = service.buildKey('users', 'a1', { page: i })
                keys.push(key)
                service.set(key, { list: [] }, 'a1')
                now += 1000
            }
            expect(service.get(keys[0]).status).toBe('miss')
            expect(service.get(keys[40]).status).not.toBe('miss')
        })

        it('does not let one account\'s entries evict another account\'s entries out of the shared cap', () => {
            setUser('user1')
            const acct1Keys: string[] = []
            for (let i = 0; i < 40; i++) {
                const key = service.buildKey('users', 'a1', { page: i })
                acct1Keys.push(key)
                service.set(key, { list: [] }, 'a1')
                now += 1000
            }
            for (let i = 0; i < 40; i++) {
                const key = service.buildKey('users', 'a2', { page: i })
                service.set(key, { list: [] }, 'a2')
                now += 1000
            }
            acct1Keys.forEach((key) => expect(service.get(key).status).not.toBe('miss'))
        })
    })
})
