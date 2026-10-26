import { Injectable } from '@angular/core'
import K from '../constants'
import Encryption from '../util/Encryption'

// Matches DashboardCacheStorageService's TTL/fresh-window standard (30 min TTL, fresh = half of TTL).
export const USERS_LOCAL_CACHE_TTL_MS = 30 * 60 * 1000
export const USERS_LOCAL_CACHE_FRESH_MS = 15 * 60 * 1000
// Bumped from 1 -> 2 when accountId was added to CacheEntry: entries written under version 1 have
// no accountId, and removeUserFromAllCachedPages() deliberately skips any entry it can't scope to
// an account rather than guessing. Without this bump, every already-cached page from before this
// change would silently never get patched on delete - the participant would keep reappearing from
// that stale entry until it aged out on its own via the normal TTL. Bumping treats every old entry
// as a one-time miss (self-healing on next visit, with accountId then recorded correctly) instead.
const CACHE_VERSION = 2
const KEY_PREFIX = 'users'
// Users-table cache has one entry per distinct (page, filters, sort, search, account) combo,
// unlike the dashboard's fixed handful of widget keys - cap total entries per user so filter
// churn can't grow localStorage without bound.
const MAX_ENTRIES_PER_USER = 30

interface CacheEntry<T> {
    data: T
    timestamp: number
    version: number
    userId: string
    // Which account this page was fetched for - populated at write time from the request
    // payload's accountId. Lets removeUserFromAllCachedPages() scope a removal to the account the
    // participant was actually removed from, instead of scrubbing them from every account's
    // cached pages (a participant can be a legitimate member of more than one account).
    // Optional/undefined on entries written before this field existed - those are left alone by
    // removeUserFromAllCachedPages() rather than guessed at, and age out via the normal TTL.
    accountId?: string
}

export type UsersCacheStatus = 'fresh' | 'stale' | 'miss'

export interface UsersCacheResult<T> {
    status: UsersCacheStatus
    data?: T
}

function stableStringify(value: any): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
}

// djb2 - deterministic, short, good enough to disambiguate filter/page combos (not a security
// hash, just a cache-key shortener).
function hash(str: string): string {
    let h = 5381
    for (let i = 0; i < str.length; i++) {
        h = (h * 33) ^ str.charCodeAt(i)
    }
    return (h >>> 0).toString(36)
}

/**
 * Per-user, TTL-scoped localStorage cache for the Users table, keyed by a hash of the full
 * request payload (page, filters, sort, search, account, team-search flag) - mirrors
 * DashboardCacheStorageService's "does the user already have something to look at" role and
 * uses the same TTL/fresh-window standard (30 min / 15 min), but with a per-payload key instead
 * of a fixed widget key, and an LRU cap since filter combinations are unbounded.
 *
 * accountId is already part of every key (it's a field in the hashed payload), so different
 * accounts never collide on get()/set() - see ACCOUNT_ID_CACHE_KEY_FIX_PLAN.md. The LRU eviction
 * cap below is scoped per-account too (via the optional `accountId` passed to set/setIfChanged),
 * so browsing one account's filter combinations can't evict another account's still-fresh pages
 * out of the shared 30-entry budget.
 */
@Injectable({
    providedIn: 'root',
})
export class UsersCacheStorageService {
    private getUserId(): string {
        const decrypted = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (!decrypted) return ''
        try {
            return JSON.parse(decrypted)?.personId ?? ''
        } catch {
            return ''
        }
    }

    /** Deterministic cache key for a given getUsersList request payload. */
    buildKey(payload: any): string {
        const userId = this.getUserId()
        return `${KEY_PREFIX}:${userId}:${hash(stableStringify(payload))}`
    }

    get<T>(key: string): UsersCacheResult<T> {
        const userId = this.getUserId()
        if (!userId) return { status: 'miss' }

        const raw = localStorage.getItem(key)
        if (!raw) return { status: 'miss' }

        let entry: CacheEntry<T>
        try {
            entry = JSON.parse(raw)
        } catch {
            return { status: 'miss' }
        }

        if (entry.version !== CACHE_VERSION || entry.userId !== userId) return { status: 'miss' }

        const age = Date.now() - entry.timestamp
        if (age > USERS_LOCAL_CACHE_TTL_MS) return { status: 'miss' }

        return { status: age < USERS_LOCAL_CACHE_FRESH_MS ? 'fresh' : 'stale', data: entry.data }
    }

    set<T>(key: string, data: T, accountId?: string): void {
        const userId = this.getUserId()
        if (!userId) return

        const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId, accountId }
        this.safeWrite(key, JSON.stringify(entry))
        this.enforceCap(userId, accountId, key, entry.timestamp)
    }

    /** Same semantics as DashboardCacheStorageService.setIfChanged - see its comment. */
    setIfChanged<T>(key: string, data: T, accountId?: string): boolean {
        const userId = this.getUserId()
        if (!userId) return false

        const raw = localStorage.getItem(key)
        let changed = true
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as CacheEntry<T>
                if (parsed.version === CACHE_VERSION && parsed.userId === userId) {
                    changed = JSON.stringify(parsed.data) !== JSON.stringify(data)
                }
            } catch {
                // Corrupt entry - fail open (changed = true) and overwrite it below.
            }
        }

        const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId, accountId }
        this.safeWrite(key, JSON.stringify(entry))
        this.enforceCap(userId, accountId, key, entry.timestamp)

        return changed
    }

    /**
     * Best-effort localStorage write: a full or unavailable localStorage (quota exceeded,
     * Safari private mode) must never turn a successful HTTP response into a failed one for the
     * caller. On a quota error, drop this user's own cache once (freeing the most likely
     * culprit - the app's own accumulated entries, not other localStorage consumers like the
     * auth token) and retry; if it still fails, give up silently and let the request proceed
     * uncached rather than throwing out of a success handler.
     */
    private safeWrite(key: string, value: string): void {
        try {
            localStorage.setItem(key, value)
        } catch {
            try {
                this.clearForCurrentUser()
                localStorage.setItem(key, value)
            } catch {
                // Storage is genuinely unavailable - caching is an optimization, not a
                // requirement, so degrade to no-cache instead of propagating the error.
            }
        }
    }

    /** Removes every cached Users-table entry belonging to userId. */
    clear(userId: string): void {
        if (!userId) return
        const prefix = `${KEY_PREFIX}:${userId}:`
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(prefix)) localStorage.removeItem(key)
        }
    }

    /** Convenience wrapper for logout call sites - see DashboardCacheStorageService's identical
     * method for the ordering caveat (must run before anything wipes K.APP.USER_OBJECT). */
    clearForCurrentUser(): void {
        this.clear(this.getUserId())
    }

    /** Invalidation entry point for any mutation (edit/delete/tag change) that can make a
     * cached page stale. Purges the whole per-user cache rather than the single affected page -
     * the dataset is small enough that this is simpler and safer than trying to guess which
     * cached pages the mutation actually affects. */
    purgeAll(): void {
        this.clearForCurrentUser()
    }

    /**
     * Removes a single participant from every cached page belonging to `accountId`, instead of
     * purging the whole per-user cache. Used by the "remove participant from account" flow so the
     * table updates instantly from the already-fetched data instead of forcing a loader-visible
     * re-fetch on every delete.
     *
     * Scoped to `accountId` deliberately: a participant can be a legitimate member of more than
     * one account, and this removal only ever applies to one of them. Entries written before the
     * accountId field existed (`entry.accountId === undefined`) are left untouched rather than
     * guessed at - they age out via the normal TTL instead.
     *
     * Patched entries are downgraded to the stale boundary (not deleted, not left fresh) so nothing
     * shows a hard cache miss, but the next time that page is actually viewed, SWR's background
     * revalidation fetches the server's true state and self-corrects any page-boundary drift the
     * removal introduced (e.g. the page now has 9 rows instead of 10) - see
     * docs/USER_DELETE_CACHE_PLAN.md for why re-deriving exact pagination client-side isn't
     * attempted here.
     */
    removeUserFromAllCachedPages(accountId: string, personId: string): void {
        const userId = this.getUserId()
        if (!userId || !accountId || !personId) return

        for (const { key } of this.readIndex(userId, accountId)) {
            const raw = localStorage.getItem(key)
            if (!raw) continue

            let entry: CacheEntry<any>
            try {
                entry = JSON.parse(raw)
            } catch {
                continue
            }

            if (entry.version !== CACHE_VERSION || entry.userId !== userId || entry.accountId !== accountId) continue

            // What's cached here is the raw HttpResponse object returned by getUsersListCall
            // (the same value withStaleWhileRevalidate passes straight through as
            // `usersListResponse` to the reducer, which itself reads `usersListResponse.body.data`
            // - see main-users-list.reducer.ts) - the row array lives at data.body.data.userList,
            // not at the top level.
            const list = entry?.data?.body?.data?.userList
            if (!Array.isArray(list)) continue

            const filtered = list.filter((u: any) => u?.personID !== personId)
            if (filtered.length === list.length) continue // this page didn't contain the participant

            entry.data = {
                ...entry.data,
                body: {
                    ...entry.data.body,
                    data: { ...entry.data.body.data, userList: filtered },
                },
            }
            // Pin the timestamp exactly at the stale boundary (not "current timestamp minus fresh
            // window" relative to itself) - deterministic regardless of how old the entry already
            // was, so a patch can never accidentally push an entry past the TTL into a hard miss.
            entry.timestamp = Date.now() - USERS_LOCAL_CACHE_FRESH_MS
            this.safeWrite(key, JSON.stringify(entry))
        }
    }

    /** `accountId` defaults to a fixed '_' bucket for the rare/legacy call sites that don't pass
     * one (see set()/setIfChanged()'s optional param) - keeps every caller's index write
     * addressable without forcing accountId to be mandatory everywhere. */
    private indexKey(userId: string, accountId?: string): string {
        return `${KEY_PREFIX}:${userId}:${accountId || '_'}:__index`
    }

    private readIndex(userId: string, accountId?: string): { key: string; timestamp: number }[] {
        try {
            return JSON.parse(localStorage.getItem(this.indexKey(userId, accountId)) || '[]')
        } catch {
            return []
        }
    }

    /**
     * Keeps a small per-user, per-account index of {key, timestamp} instead of scanning the
     * whole localStorage keyspace on every write - this runs on every users-list fetch
     * (including every silent background SWR refresh), so it needs to stay O(entries-we-own),
     * not O(everything the browser tab has ever stored: auth tokens, redux-persist, dashboard
     * cache, etc). Scoped per-account so an admin browsing several accounts' Users tables in one
     * session can't have one account's filter/page combinations evict another account's
     * still-fresh cached pages out of the shared 30-entry cap.
     */
    private enforceCap(userId: string, accountId: string | undefined, writtenKey: string, timestamp: number): void {
        const entries = this.readIndex(userId, accountId)

        // Refreshing a key already in the index doesn't change entry count, so there's nothing
        // to evict and no ordering change worth the write - skip it. This is the hot path: every
        // silent background SWR refresh re-writes the same key.
        if (entries.some((e) => e.key === writtenKey)) return

        entries.push({ key: writtenKey, timestamp })

        if (entries.length > MAX_ENTRIES_PER_USER) {
            entries.sort((a, b) => a.timestamp - b.timestamp)
            const excess = entries.length - MAX_ENTRIES_PER_USER
            for (let i = 0; i < excess; i++) localStorage.removeItem(entries[i].key)
            entries.splice(0, excess)
        }

        this.safeWrite(this.indexKey(userId, accountId), JSON.stringify(entries))
    }
}
