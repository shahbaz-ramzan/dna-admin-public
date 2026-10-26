import { Injectable } from '@angular/core'
import K from '../constants'
import Encryption from '../util/Encryption'

export const DASHBOARD_LOCAL_CACHE_TTL_MS = 30 * 60 * 1000
const CACHE_VERSION = 1
const KEY_PREFIX = 'dashboard'
// Widget keys are `${widgetName}:${accountId}` (4 widgets today) with no eviction, so a
// top-level admin who has ever viewed N accounts accumulates 4*N entries for the life of the
// session - only cleared on logout. Cap it the same way UsersCacheStorageService caps its
// per-payload entries, so an admin with many accounts can't grow this unbounded.
const MAX_ENTRIES_PER_USER = 200

interface CacheEntry<T> {
    data: T
    timestamp: number
    version: number
    userId: string
}

export type DashboardCacheStatus = 'fresh' | 'stale' | 'miss'

export interface DashboardCacheResult<T> {
    status: DashboardCacheStatus
    data?: T
}

/**
 * Per-user, TTL-scoped localStorage cache for dashboard widgets. This is the "does the user
 * already have something to look at" tier used to skip the loader on repeat visits/logins;
 * it is independent of CacheInterceptor's short-lived in-memory HTTP cache (see the comment on
 * CACHE_TTL_MS in cache.interceptor.ts for how the two interact).
 *
 * Notes on scope:
 * - This cache does NOT reduce API call volume - every dashboard visit within the 30-minute
 *   window still triggers a real (silent) background fetch to revalidate. It only removes the
 *   loading spinner by rendering the last-known-good data instantly while that happens.
 * - No cross-tab sync: a background revalidation in one tab does not update another open tab
 *   showing the same dashboard. Each tab only picks up newer data on its own next read (e.g.
 *   its own remount/dispatch), via localStorage's normal same-tab read/write - there's no
 *   `storage` event listener here. Acceptable for this use case; call out explicitly if that
 *   changes.
 */
@Injectable({
    providedIn: 'root',
})
export class DashboardCacheStorageService {
    private getUserId(): string {
        const decrypted = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (!decrypted) return ''
        try {
            return JSON.parse(decrypted)?.personId ?? ''
        } catch {
            return ''
        }
    }

    private buildKey(widgetKey: string, userId: string): string {
        return `${KEY_PREFIX}:${userId}:${widgetKey}`
    }

    get<T>(widgetKey: string): DashboardCacheResult<T> {
        const userId = this.getUserId()
        if (!userId) return { status: 'miss' }

        const raw = localStorage.getItem(this.buildKey(widgetKey, userId))
        if (!raw) return { status: 'miss' }

        let entry: CacheEntry<T>
        try {
            entry = JSON.parse(raw)
        } catch {
            return { status: 'miss' }
        }

        if (entry.version !== CACHE_VERSION || entry.userId !== userId) return { status: 'miss' }

        const age = Date.now() - entry.timestamp
        if (age > DASHBOARD_LOCAL_CACHE_TTL_MS) return { status: 'miss' }

        return { status: age < DASHBOARD_LOCAL_CACHE_TTL_MS / 2 ? 'fresh' : 'stale', data: entry.data }
    }

    set<T>(widgetKey: string, data: T): void {
        const userId = this.getUserId()
        if (!userId) return

        const key = this.buildKey(widgetKey, userId)
        const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId }
        this.safeWrite(key, JSON.stringify(entry))
        this.enforceCap(userId, key, entry.timestamp)
    }

    /**
     * Writes `data` only if it differs from what's currently cached; always refreshes the
     * TTL clock either way (a confirmed-unchanged revalidation is still evidence the data is
     * current). Returns whether the stored value changed, so callers (SWR background refresh)
     * can skip re-rendering consumers with data they're already showing.
     */
    setIfChanged<T>(widgetKey: string, data: T): boolean {
        const userId = this.getUserId()
        if (!userId) return false

        const key = this.buildKey(widgetKey, userId)
        const raw = localStorage.getItem(key)
        let previous: T | undefined
        let changed = true
        if (raw) {
            try {
                const parsed = JSON.parse(raw) as CacheEntry<T>
                if (parsed.version === CACHE_VERSION && parsed.userId === userId) {
                    previous = parsed.data
                    changed = JSON.stringify(previous) !== JSON.stringify(data)
                }
                // A version/userId mismatch (or unparsable entry) is treated as "changed" so the
                // stale/incompatible entry gets overwritten with current data rather than silently
                // comparing against something that isn't a valid same-shape previous value.
            } catch {
                // Corrupt entry - fail open (changed = true) and overwrite it below.
            }
        }

        const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId }
        this.safeWrite(key, JSON.stringify(entry))
        this.enforceCap(userId, key, entry.timestamp)

        return changed
    }

    /** Removes every cached dashboard widget entry belonging to userId. */
    clear(userId: string): void {
        if (!userId) return
        const prefix = `${KEY_PREFIX}:${userId}:`
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(prefix)) localStorage.removeItem(key)
        }
    }

    /** Convenience wrapper for logout call sites - resolves the current user itself so callers
     * don't need to know how the user id is derived. Must be called before anything wipes
     * K.APP.USER_OBJECT (e.g. before AppService.logout()'s localStorage.clear()), otherwise
     * getUserId() has nothing left to resolve and this becomes a no-op. */
    clearForCurrentUser(): void {
        this.clear(this.getUserId())
    }

    /**
     * Best-effort localStorage write: a full or unavailable localStorage (quota exceeded,
     * Safari private mode) must never turn a successful HTTP response into a thrown error out
     * of the NgRx effect map that calls this - see dashboard.effect.ts's withStaleWhileRevalidate,
     * which has no catchError around this call. On a quota error, drop this cache's own entries
     * once (freeing the most likely culprit) and retry; if it still fails, give up silently and
     * degrade to no-cache rather than propagating. Mirrors UsersCacheStorageService.safeWrite.
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

    private indexKey(userId: string): string {
        return `${KEY_PREFIX}:${userId}:__index`
    }

    private readIndex(userId: string): { key: string; timestamp: number }[] {
        try {
            return JSON.parse(localStorage.getItem(this.indexKey(userId)) || '[]')
        } catch {
            return []
        }
    }

    /**
     * Keeps a small per-user index of {key, timestamp} so a top-level admin who has viewed many
     * accounts can't accumulate dashboard widget entries unboundedly for the life of the session
     * (previously only cleared on logout). Mirrors UsersCacheStorageService.enforceCap.
     */
    private enforceCap(userId: string, writtenKey: string, timestamp: number): void {
        const entries = this.readIndex(userId)

        // Refreshing a key already in the index doesn't change entry count - nothing to evict.
        // This is the hot path: every SWR background refresh re-writes the same 4 widget keys.
        if (entries.some((e) => e.key === writtenKey)) return

        entries.push({ key: writtenKey, timestamp })

        if (entries.length > MAX_ENTRIES_PER_USER) {
            entries.sort((a, b) => a.timestamp - b.timestamp)
            const excess = entries.length - MAX_ENTRIES_PER_USER
            for (let i = 0; i < excess; i++) localStorage.removeItem(entries[i].key)
            entries.splice(0, excess)
        }

        this.safeWrite(this.indexKey(userId), JSON.stringify(entries))
    }
}
