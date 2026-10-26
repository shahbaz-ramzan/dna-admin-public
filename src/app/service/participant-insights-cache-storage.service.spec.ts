import { TestBed } from '@angular/core/testing'
import K from '../constants'
import Encryption from '../util/Encryption'
import { INSIGHTS_LOCAL_CACHE_TTL_MS, ParticipantInsightsCacheStorageService } from './participant-insights-cache-storage.service'

function setUser(personId: string): void {
    localStorage.setItem(K.APP.USER_OBJECT, Encryption.encryptData(JSON.stringify({ personId })))
}

function setAccount(accountId: string): void {
    localStorage.setItem(K.APP.ACCOUNT_ID_KEY, Encryption.encryptData(accountId))
}

describe('ParticipantInsightsCacheStorageService', () => {
    let service: ParticipantInsightsCacheStorageService
    let now: number

    beforeEach(() => {
        localStorage.clear()
        now = Date.parse('2026-01-01T00:00:00.000Z')
        spyOn(Date, 'now').and.callFake(() => now)
        TestBed.configureTestingModule({})
        service = TestBed.inject(ParticipantInsightsCacheStorageService)
        setAccount('acct1')
    })

    afterEach(() => localStorage.clear())

    describe('buildKey()', () => {
        it('produces a deterministic key for the same URL and user', () => {
            setUser('user1')
            const key1 = service.buildKey('NaturalBehavior/GetTScore/abc')
            const key2 = service.buildKey('NaturalBehavior/GetTScore/abc')
            expect(key1).toBe(key2)
        })

        it('produces different keys for different URLs', () => {
            setUser('user1')
            expect(service.buildKey('NaturalBehavior/GetTScore/abc')).not.toBe(service.buildKey('NaturalBehavior/GetTScore/def'))
        })

        it('produces different keys for the same URL under different users', () => {
            setUser('user1')
            const key1 = service.buildKey('NaturalBehavior/GetTScore/abc')
            setUser('user2')
            const key2 = service.buildKey('NaturalBehavior/GetTScore/abc')
            expect(key1).not.toBe(key2)
        })

        it('namespaced keys carry the literal namespace prefix, unhashed', () => {
            setUser('user1')
            const key = service.buildKey('{"accountId":"1","personIds":["a"]}', 'participantsDetail:')
            expect(key).toContain(':participantsDetail:')
        })

        it('a namespaced key differs from the same stable-key string with no namespace', () => {
            setUser('user1')
            const plain = service.buildKey('same-input')
            const namespaced = service.buildKey('same-input', 'participantsDetail:')
            expect(plain).not.toBe(namespaced)
        })
    })

    describe('account scoping', () => {
        it('buildKey() returns an empty (never-cache) key when no account is selected', () => {
            setUser('user1')
            localStorage.removeItem(K.APP.ACCOUNT_ID_KEY)
            expect(service.buildKey('NaturalBehavior/GetTScore/abc')).toBe('')
        })

        it('produces different keys for the same URL/user under different accounts', () => {
            setUser('user1')
            setAccount('acct1')
            const key1 = service.buildKey('NaturalBehavior/GetTScore/abc')
            setAccount('acct2')
            const key2 = service.buildKey('NaturalBehavior/GetTScore/abc')
            expect(key1).not.toBe(key2)
        })

        it('an entry written under one account is a miss when read under a different account', () => {
            setUser('user1')
            setAccount('acct1')
            const key = service.buildKey('NaturalBehavior/GetTScore/abc')
            service.set(key, { value: 1 })

            setAccount('acct2')
            // Same participant/URL, but the key itself differs per-account, so this is really
            // "does account 2 have anything under its own key" - always a cold miss here.
            expect(service.get(service.buildKey('NaturalBehavior/GetTScore/abc')).status).toBe('miss')

            // Even reusing account 1's literal key string while scoped to account 2 must miss -
            // the stored entry's accountId is validated on read, not just the key shape.
            expect(service.get(key).status).toBe('miss')
        })

        it('set() is a no-op when no account is selected', () => {
            setUser('user1')
            localStorage.removeItem(K.APP.ACCOUNT_ID_KEY)
            const key = service.buildKey('url') // '' - no account
            expect(() => service.set(key, { value: 1 })).not.toThrow()
            setAccount('acct1')
            expect(service.get(service.buildKey('url')).status).toBe('miss')
        })

        it('clearByPrefix() only clears the current account\'s entries, leaving another account\'s untouched', () => {
            setUser('user1')
            setAccount('acct1')
            const keyAcct1 = service.buildKey('{"accountId":"1","personIds":["a"]}', 'participantsDetail:')
            service.set(keyAcct1, { value: 'acct1-detail' })

            setAccount('acct2')
            const keyAcct2 = service.buildKey('{"accountId":"2","personIds":["a"]}', 'participantsDetail:')
            service.set(keyAcct2, { value: 'acct2-detail' })

            service.clearByPrefix('participantsDetail:')
            expect(service.get(keyAcct2).status).toBe('miss')

            setAccount('acct1')
            expect(service.get(keyAcct1).data).toEqual({ value: 'acct1-detail' })
        })

        it('the byte-budget eviction index is scoped per-account, not shared across accounts', () => {
            setUser('user1')
            const bigValue = 'x'.repeat(500 * 1024)

            setAccount('acct1')
            const acct1Keys = Array.from({ length: 3 }, (_, i) => service.buildKey(`acct1-url-${i}`))
            acct1Keys.forEach((key, i) => {
                service.set(key, { blob: bigValue })
                now += 1000 * (i + 1)
            })

            setAccount('acct2')
            const acct2Keys = Array.from({ length: 3 }, (_, i) => service.buildKey(`acct2-url-${i}`))
            acct2Keys.forEach((key, i) => {
                service.set(key, { blob: bigValue })
                now += 1000 * (i + 1)
            })

            // Writing account 2's entries must not have evicted account 1's - each account's
            // ~1.5MB total is well under the 2MB budget on its own, but would collide over the
            // shared 2MB budget if the index were still per-user instead of per-account.
            setAccount('acct1')
            acct1Keys.forEach((key) => expect(service.get(key).status).not.toBe('miss'))
        })

        it('clear(userId) sweeps every account partition for that user', () => {
            setUser('user1')
            setAccount('acct1')
            const keyAcct1 = service.buildKey('url')
            service.set(keyAcct1, { value: 1 })

            setAccount('acct2')
            const keyAcct2 = service.buildKey('url')
            service.set(keyAcct2, { value: 2 })

            service.clear('user1')

            setAccount('acct1')
            expect(service.get(keyAcct1).status).toBe('miss')
            setAccount('acct2')
            expect(service.get(keyAcct2).status).toBe('miss')
        })
    })

    describe('clearByPrefix()', () => {
        it('removes only entries whose key was built with the given namespace', () => {
            setUser('user1')
            const detailKey = service.buildKey('{"accountId":"1","personIds":["a"]}', 'participantsDetail:')
            const widgetKey = service.buildKey('NaturalBehavior/GetTScore/abc')
            service.set(detailKey, { value: 'detail' })
            service.set(widgetKey, { value: 'widget' })

            service.clearByPrefix('participantsDetail:')

            expect(service.get(detailKey).status).toBe('miss')
            expect(service.get(widgetKey).status).not.toBe('miss')
        })

        it('prunes the shared byte-budget index too, not just the entries themselves', () => {
            setUser('user1')
            const detailKey = service.buildKey('{"accountId":"1","personIds":["a"]}', 'participantsDetail:')
            const widgetKey = service.buildKey('NaturalBehavior/GetTScore/abc')
            service.set(detailKey, { value: 'detail' })
            service.set(widgetKey, { value: 'widget' })

            service.clearByPrefix('participantsDetail:')

            const index = JSON.parse(localStorage.getItem('insights:user1:acct1:__index') || '[]')
            expect(index.some((e: { key: string }) => e.key === detailKey)).toBe(false)
            expect(index.some((e: { key: string }) => e.key === widgetKey)).toBe(true)
        })
    })

    describe('get()/set() - TTL and fresh-window boundaries', () => {
        it('returns miss when no user is resolvable', () => {
            expect(service.get('someKey').status).toBe('miss')
        })

        it('returns miss when nothing is cached under the key', () => {
            setUser('user1')
            const key = service.buildKey('url')
            expect(service.get(key).status).toBe('miss')
        })

        it('returns fresh for an entry younger than the fresh window', () => {
            setUser('user1')
            const key = service.buildKey('url')
            service.set(key, { value: 1 })
            now += INSIGHTS_LOCAL_CACHE_TTL_MS / 4
            const result = service.get<{ value: number }>(key)
            expect(result.status).toBe('fresh')
            expect(result.data).toEqual({ value: 1 })
        })

        it('returns stale once past the fresh window but still within the TTL', () => {
            setUser('user1')
            const key = service.buildKey('url')
            service.set(key, { value: 1 })
            now += INSIGHTS_LOCAL_CACHE_TTL_MS * 0.75
            expect(service.get(key).status).toBe('stale')
        })

        it('returns miss once the entry is older than the TTL', () => {
            setUser('user1')
            const key = service.buildKey('url')
            service.set(key, { value: 1 })
            now += INSIGHTS_LOCAL_CACHE_TTL_MS + 1
            expect(service.get(key).status).toBe('miss')
        })

        it('returns miss for a corrupted cache entry instead of throwing', () => {
            setUser('user1')
            const key = service.buildKey('url')
            localStorage.setItem(key, '{not-json')
            expect(service.get(key).status).toBe('miss')
        })
    })

    describe('set() / setIfChanged() - refuse to cache empty payloads', () => {
        it('set() does not write when data is undefined', () => {
            setUser('user1')
            const key = service.buildKey('url')
            service.set(key, undefined)
            expect(service.get(key).status).toBe('miss')
        })

        it('set() does not write when data is null', () => {
            setUser('user1')
            const key = service.buildKey('url')
            service.set(key, null)
            expect(service.get(key).status).toBe('miss')
        })

        it('setIfChanged() returns false and does not write when data is undefined', () => {
            setUser('user1')
            const key = service.buildKey('url')
            expect(service.setIfChanged(key, undefined)).toBe(false)
            expect(service.get(key).status).toBe('miss')
        })

        it('setIfChanged() reports changed on first write and unchanged on an identical second write', () => {
            setUser('user1')
            const key = service.buildKey('url')
            expect(service.setIfChanged(key, { value: 1 })).toBe(true)
            expect(service.setIfChanged(key, { value: 1 })).toBe(false)
            expect(service.setIfChanged(key, { value: 2 })).toBe(true)
        })
    })

    describe('byte-budget eviction', () => {
        it('evicts the oldest entries once the cumulative byte budget is exceeded', () => {
            setUser('user1')
            // A payload comfortably larger than a real insight response, so a handful of writes
            // cross the 2MB budget without needing thousands of iterations in the test.
            const bigValue = 'x'.repeat(500 * 1024) // ~500KB per entry once JSON-wrapped

            const keys = Array.from({ length: 6 }, (_, i) => service.buildKey(`url-${i}`))
            keys.forEach((key, i) => {
                service.set(key, { blob: bigValue })
                now += 1000 * (i + 1) // strictly increasing timestamps so eviction order is deterministic
            })

            // 6 * ~500KB > 2MB budget - the earliest-written keys should have been evicted first.
            expect(service.get(keys[0]).status).toBe('miss')
            // The most recently written entry must survive.
            expect(service.get(keys[keys.length - 1]).status).not.toBe('miss')
        })
    })

    describe('quota-exceeded fallback', () => {
        it('falls back to clearing its own cache and retrying instead of throwing', () => {
            setUser('user1')
            const key = service.buildKey('url')

            let calls = 0
            const originalSetItem = localStorage.setItem.bind(localStorage)
            spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => {
                calls++
                if (calls === 1) throw new DOMException('quota exceeded', 'QuotaExceededError')
                originalSetItem(k, v)
            })

            expect(() => service.set(key, { value: 1 })).not.toThrow()
        })
    })

    describe('setMany() - Phase 1 batch write primitive', () => {
        it('writes every entry, each individually readable via get()', () => {
            setUser('user1')
            const keyA = service.buildKey('personA')
            const keyB = service.buildKey('personB')

            service.setMany([
                { key: keyA, data: { firstName: 'Nora' } },
                { key: keyB, data: { firstName: 'Robert' } },
            ])

            expect(service.get(keyA).data).toEqual({ firstName: 'Nora' })
            expect(service.get(keyB).data).toEqual({ firstName: 'Robert' })
        })

        it('updates the shared byte-budget index exactly once for the whole batch, not once per entry', () => {
            setUser('user1')
            const keys = Array.from({ length: 5 }, (_, i) => service.buildKey(`person-${i}`))
            spyOn(localStorage, 'setItem').and.callThrough()

            service.setMany(keys.map((key, i) => ({ key, data: { i } })))

            const indexWrites = (localStorage.setItem as jasmine.Spy).calls
                .allArgs()
                .filter(([k]) => k === 'insights:user1:acct1:__index')
            // One index write for the batch (plus each entry's own write) - not 5 index writes.
            expect(indexWrites.length).toBe(1)

            const index = JSON.parse(localStorage.getItem('insights:user1:acct1:__index') || '[]')
            expect(index.length).toBe(5)
        })

        it('silently drops undefined/null entries within a batch without dropping the rest', () => {
            setUser('user1')
            const keyA = service.buildKey('personA')
            const keyB = service.buildKey('personB')

            service.setMany([
                { key: keyA, data: undefined },
                { key: keyB, data: { firstName: 'Robert' } },
            ])

            expect(service.get(keyA).status).toBe('miss')
            expect(service.get(keyB).data).toEqual({ firstName: 'Robert' })
        })

        it('no-ops (no throw, no index write) when every entry in the batch is empty', () => {
            setUser('user1')
            expect(() => service.setMany([{ key: service.buildKey('x'), data: undefined }])).not.toThrow()
            expect(localStorage.getItem('insights:user1:acct1:__index')).toBeNull()
        })

        it('evicts the oldest entries once a single batch pushes the cumulative budget over MAX_BYTES', () => {
            setUser('user1')
            const bigValue = 'x'.repeat(500 * 1024)
            const keys = Array.from({ length: 6 }, (_, i) => service.buildKey(`batch-url-${i}`))

            service.setMany(keys.map((key) => ({ key, data: { blob: bigValue } })))

            // All 6 entries share ONE timestamp (same batch) - eviction still keeps total <= MAX_BYTES,
            // by whatever tie-break the sort applies, and some entries must have been evicted.
            const survivingCount = keys.filter((k) => service.get(k).status !== 'miss').length
            expect(survivingCount).toBeLessThan(keys.length)
        })

        it('a later setMany() batch can evict entries written by an earlier individual set() call', () => {
            setUser('user1')
            const bigValue = 'x'.repeat(500 * 1024)
            const oldKey = service.buildKey('old-single-entry')
            service.set(oldKey, { blob: bigValue })
            now += 1000

            const batchKeys = Array.from({ length: 5 }, (_, i) => service.buildKey(`batch-${i}`))
            service.setMany(batchKeys.map((key) => ({ key, data: { blob: bigValue } })))

            expect(service.get(oldKey).status).toBe('miss')
        })
    })

    describe('remove() - Phase 1 single-key delete primitive', () => {
        it('removes only the targeted entry, leaving others untouched', () => {
            setUser('user1')
            const keyA = service.buildKey('personA')
            const keyB = service.buildKey('personB')
            service.set(keyA, { value: 'a' })
            service.set(keyB, { value: 'b' })

            service.remove(keyA)

            expect(service.get(keyA).status).toBe('miss')
            expect(service.get(keyB).data).toEqual({ value: 'b' })
        })

        it('prunes the removed key out of the shared byte-budget index', () => {
            setUser('user1')
            const key = service.buildKey('personA')
            service.set(key, { value: 'a' })

            service.remove(key)

            const index = JSON.parse(localStorage.getItem('insights:user1:acct1:__index') || '[]')
            expect(index.some((e: { key: string }) => e.key === key)).toBe(false)
        })

        it('is a safe no-op when the key was never cached', () => {
            setUser('user1')
            expect(() => service.remove(service.buildKey('never-written'))).not.toThrow()
        })

        it('is a safe no-op when no user is resolvable', () => {
            expect(() => service.remove('someKey')).not.toThrow()
        })
    })

    describe('clear() / clearForCurrentUser() / purgeAll()', () => {
        it('removes only the given user\'s entries', () => {
            setUser('user1')
            const keyA = service.buildKey('urlA')
            service.set(keyA, { value: 1 })
            setUser('user2')
            const keyB = service.buildKey('urlA')
            service.set(keyB, { value: 2 })

            service.clear('user1')

            setUser('user1')
            expect(service.get(keyA).status).toBe('miss')
            setUser('user2')
            expect(service.get(keyB).data).toEqual({ value: 2 })
        })

        it('purgeAll() clears the current user\'s entries', () => {
            setUser('user1')
            const key = service.buildKey('url')
            service.set(key, { value: 1 })
            service.purgeAll()
            expect(service.get(key).status).toBe('miss')
        })
    })
})
