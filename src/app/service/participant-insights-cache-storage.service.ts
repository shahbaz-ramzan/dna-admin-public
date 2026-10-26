import { Injectable } from '@angular/core'
import K from '../constants'
import Encryption from '../util/Encryption'

// Same TTL/fresh-window standard as DashboardCacheStorageService/UsersCacheStorageService.
export const INSIGHTS_LOCAL_CACHE_TTL_MS = 30 * 60 * 1000
export const INSIGHTS_LOCAL_CACHE_FRESH_MS = 15 * 60 * 1000
// Bumped 1 -> 2 when accountId was added to the key/entry - see class doc. Old (unscoped)
// entries fail the version check below and are read as a one-time miss instead of being
// misattributed to whichever account happens to be selected now.
const CACHE_VERSION = 2
const KEY_PREFIX = 'insights'
// Measured ~15.5 KB across all 14 single-user insight widgets for one participant (see
// USER_SELECTION_INSIGHTS_CACHING_PLAN.md §1) - a byte budget, not an entry-count cap, because
// entry sizes vary too widely across widgets (financialStyleMatch ~330B vs behavioralBiases
// ~2.6KB) for a count-based cap to bound actual storage the way it does for UsersCacheStorageService
// (whose entries are all roughly the same shape/size).
const MAX_BYTES = 2 * 1024 * 1024

interface CacheEntry<T> {
    data: T
    timestamp: number
    version: number
    userId: string
    // Which account this entry was fetched under - validated on read in addition to the key
    // itself carrying the account segment, as defence in depth against a hash collision or a
    // hand-edited localStorage entry. See class doc for why this was added.
    accountId: string
}

export type InsightsCacheStatus = 'fresh' | 'stale' | 'miss'

export interface InsightsCacheResult<T> {
    status: InsightsCacheStatus
    data?: T
}

// djb2 - deterministic, short, good enough to turn a request URL into a compact cache-key
// segment (not a security hash).
function hash(str: string): string {
    let h = 5381
    for (let i = 0; i < str.length; i++) {
        h = (h * 33) ^ str.charCodeAt(i)
    }
    return (h >>> 0).toString(36)
}

/**
 * Per-user, per-account, TTL-scoped localStorage cache for the participant-selection insight
 * widgets (single/double/three-user selection). Keyed by `{userId}:{accountId}:{hash(url)}` -
 * see ACCOUNT_ID_CACHE_KEY_FIX_PLAN.md.
 *
 * The account segment was added because a participant can belong to more than one account, and
 * an earlier URL-only key (no accountId) meant switching accounts could replay a *different*
 * account's cached response for the same participant - a data-correctness bug, not just a stale
 * read. Callers are still responsible for building the key from the exact URL/params the request
 * actually uses (buildKey adds the userId/accountId wrapper; it does not otherwise alter or
 * validate what goes into the key).
 *
 * Uses a byte budget rather than an entry-count cap (see MAX_BYTES comment) since these ~14
 * widgets vary too much in size for a count-based cap to bound storage meaningfully. The budget
 * is scoped per-account (see indexKey()), so browsing one account can no longer evict another
 * account's still-valid entries.
 */
@Injectable({
    providedIn: 'root',
})
export class ParticipantInsightsCacheStorageService {
    private getUserId(): string {
        const decrypted = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (!decrypted) return ''
        try {
            return JSON.parse(decrypted)?.personId ?? ''
        } catch {
            return ''
        }
    }

    /** Currently selected account, same encrypted-localStorage pattern as getUserId(). */
    private getAccountId(): string {
        return Encryption.decryptData(localStorage.getItem(K.APP.ACCOUNT_ID_KEY) || '') || ''
    }

    /** `insights:{userId}:{accountId}:` - the shared prefix every key/index for the current
     * scope lives under. Returns null when either id is missing (no user, or no account selected
     * yet) so callers can treat that as "never cache" instead of writing into a blank, shared
     * `insights:{userId}::` bucket that every account-less moment would collide into. */
    private scopePrefix(): { userId: string; accountId: string; prefix: string } | null {
        const userId = this.getUserId()
        const accountId = this.getAccountId()
        if (!userId || !accountId) return null
        return { userId, accountId, prefix: `${KEY_PREFIX}:${userId}:${accountId}:` }
    }

    /**
     * Deterministic cache key for a given request URL (see class doc for why URL, not
     * personIds/accountId, for the ~14 GET-based insight widgets).
     *
     * `namespace` is for callers whose request isn't URL-disambiguated (e.g. a POST endpoint
     * like getParticipantsDetail, where every call hits the same URL and only the body differs
     * per participant) - pass a stable string built from the actual request params instead of a
     * URL, plus a literal namespace prefix (e.g. `'participantsDetail:'`) so clearByPrefix() can
     * later target just that family of entries by literal prefix match. The hash itself never
     * exposes the un-hashed input as a substring, so clearByPrefix only works via this explicit,
     * un-hashed namespace segment - not by guessing at hash output.
     */
    buildKey(requestUrlOrStableKey: string, namespace = ''): string {
        const scope = this.scopePrefix()
        if (!scope) return ''
        return `${scope.prefix}${namespace}${hash(requestUrlOrStableKey)}`
    }

    get<T>(key: string): InsightsCacheResult<T> {
        if (!key) return { status: 'miss' }
        const scope = this.scopePrefix()
        if (!scope) return { status: 'miss' }

        const raw = localStorage.getItem(key)
        if (!raw) return { status: 'miss' }

        let entry: CacheEntry<T>
        try {
            entry = JSON.parse(raw)
        } catch {
            return { status: 'miss' }
        }

        // Validates accountId in addition to userId/version - defence in depth against a hash
        // collision or a hand-edited localStorage entry landing under the right key but the
        // wrong account, on top of the key itself already carrying the account segment.
        if (entry.version !== CACHE_VERSION || entry.userId !== scope.userId || entry.accountId !== scope.accountId) {
            return { status: 'miss' }
        }

        const age = Date.now() - entry.timestamp
        if (age > INSIGHTS_LOCAL_CACHE_TTL_MS) return { status: 'miss' }

        return { status: age < INSIGHTS_LOCAL_CACHE_FRESH_MS ? 'fresh' : 'stale', data: entry.data }
    }

    /** Refuses to cache undefined/null payloads - see plan §0.1: these effects reuse their
     * success action type on error with an undefined/error-shaped payload, so a naive
     * "cache on success" write would persist garbage for the full TTL. Callers must not rely on
     * the success action alone to decide whether to cache - check the payload themselves too,
     * but this is a last line of defense against the most common failure shape.
     *
     * The entire body is wrapped in try/catch: this runs inside withStaleWhileRevalidate's
     * `map()`, ahead of the success action being built, so any exception here (a JSON.stringify
     * edge case, anything) would otherwise turn an already-successful API response into a
     * dispatched failure - caching must never be able to break the real data reaching the
     * component. See SINGLE_USER_SELECTION_CACHING_PLAN.md for the incident this guards against. */
    set<T>(key: string, data: T): void {
        if (!key || data === undefined || data === null) return

        try {
            const scope = this.scopePrefix()
            if (!scope) return

            const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId: scope.userId, accountId: scope.accountId }
            const serialized = JSON.stringify(entry)
            this.safeWrite(key, serialized)
            this.enforceBudget(scope, key, entry.timestamp, serialized.length)
        } catch {
            // Caching is an optimization, never a requirement - degrade to no-cache rather than
            // letting a storage/serialization failure propagate out of an effect's success path.
        }
    }

    /**
     * Batch write for cases that would otherwise call set() in a loop (e.g. writing one entry
     * per participant after a single getParticipantsDetail response) - see
     * PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md §5.4/§6.4. set() rewrites the shared per-user
     * `__index` and runs enforceBudget() on EVERY call; calling it N times for N entries means N
     * full index read-JSON.stringify-write round trips and N eviction sweeps for what should be
     * one. setMany() updates the index and runs eviction exactly once for the whole batch.
     *
     * Same undefined/null refusal as set() (silently dropped, not an error), and the same
     * "caching is an optimization, never a requirement" try/catch shielding.
     */
    setMany<T>(entries: { key: string; data: T }[]): void {
        const valid = entries.filter((e) => e.key && e.data !== undefined && e.data !== null)
        if (!valid.length) return

        try {
            const scope = this.scopePrefix()
            if (!scope) return

            const timestamp = Date.now()
            const written = valid.map(({ key, data }) => {
                const entry: CacheEntry<T> = { data, timestamp, version: CACHE_VERSION, userId: scope.userId, accountId: scope.accountId }
                const serialized = JSON.stringify(entry)
                this.safeWrite(key, serialized)
                return { key, timestamp, bytes: serialized.length }
            })

            this.enforceBudgetMany(scope, written)
        } catch {
            // Caching is an optimization, never a requirement - see set()'s identical comment.
        }
    }

    /**
     * Removes a single cache entry and its index record, without touching any other entry. Used
     * for targeted invalidation (e.g. a single participant's cached detail record) where
     * clearByPrefix()'s whole-namespace sweep would be broader than necessary - see
     * PARTICIPANT_DETAILS_PER_PERSON_CACHE_PLAN.md §6.8.
     */
    remove(key: string): void {
        if (!key) return
        const scope = this.scopePrefix()
        if (!scope) return

        localStorage.removeItem(key)
        const entries = this.readIndex(scope).filter((e) => e.key !== key)
        this.safeWrite(this.indexKey(scope), JSON.stringify(entries))
    }

    /** Same semantics as DashboardCacheStorageService.setIfChanged - see its comment. Also
     * refuses undefined/null payloads, per the same reasoning as set() above, and is wrapped in
     * try/catch for the same reason - see set()'s comment. Fails open (reports `changed = true`)
     * on any internal error, since the caller's fallback behavior for "cache write failed" should
     * be the same as "cache was never populated", not silently different. */
    setIfChanged<T>(key: string, data: T): boolean {
        if (!key || data === undefined || data === null) return false

        try {
            const scope = this.scopePrefix()
            if (!scope) return false

            const raw = localStorage.getItem(key)
            let changed = true
            if (raw) {
                try {
                    const parsed = JSON.parse(raw) as CacheEntry<T>
                    if (parsed.version === CACHE_VERSION && parsed.userId === scope.userId && parsed.accountId === scope.accountId) {
                        changed = JSON.stringify(parsed.data) !== JSON.stringify(data)
                    }
                } catch {
                    // Corrupt entry - fail open (changed = true) and overwrite it below.
                }
            }

            const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId: scope.userId, accountId: scope.accountId }
            const serialized = JSON.stringify(entry)
            this.safeWrite(key, serialized)
            this.enforceBudget(scope, key, entry.timestamp, serialized.length)

            return changed
        } catch {
            return true
        }
    }

    /** Best-effort write - see UsersCacheStorageService.safeWrite for the quota-exceeded rationale. */
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

    /** Removes every cached insights entry belonging to userId, across every account partition -
     * the prefix here (`insights:{userId}:`) is deliberately one segment shorter than a single
     * account's scope prefix, so it still matches every account's keys and __index. */
    clear(userId: string): void {
        if (!userId) return
        const prefix = `${KEY_PREFIX}:${userId}:`
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(prefix)) localStorage.removeItem(key)
        }
    }

    clearForCurrentUser(): void {
        this.clear(this.getUserId())
    }

    /** Invalidation entry point for mutations that make cached insights stale (profile/tag/
     * facilitator/photo edits) - see plan §5. A full purge is fine here: these mutations are
     * rare relative to selection views. */
    purgeAll(): void {
        this.clearForCurrentUser()
    }

    /**
     * Removes only entries whose cache key starts with `keyPrefix` (a raw string passed to
     * buildKey, e.g. `'participantsDetail:'` prepended by the caller before hashing per
     * participant), leaving every other cached widget untouched. Used when a mutation only
     * invalidates one specific cache (e.g. a profile edit only affects that participant's
     * detail, not their sorting order or other insight widgets) - a full purgeAll() in that case
     * would force an unnecessary loader-visible refetch on unrelated, still-valid widgets.
     */
    clearByPrefix(keyPrefix: string): void {
        const scope = this.scopePrefix()
        if (!scope) return
        const prefix = `${scope.prefix}${keyPrefix}`
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(prefix)) localStorage.removeItem(key)
        }

        // Unlike clear()/purgeAll() (which wipes the __index key too, since it shares the same
        // scope prefix), this only removes matching entries - the per-account __index used by
        // enforceBudget() for byte-budget LRU eviction would otherwise keep phantom entries
        // pointing at now-deleted keys, inflating the tracked total and risking premature
        // eviction of unrelated, still-valid widget caches later.
        const entries = this.readIndex(scope).filter((e) => !e.key.startsWith(prefix))
        this.safeWrite(this.indexKey(scope), JSON.stringify(entries))
    }

    private indexKey(scope: { prefix: string }): string {
        return `${scope.prefix}__index`
    }

    private readIndex(scope: { prefix: string }): { key: string; timestamp: number; bytes: number }[] {
        try {
            return JSON.parse(localStorage.getItem(this.indexKey(scope)) || '[]')
        } catch {
            return []
        }
    }

    /**
     * Keeps a small per-user index of {key, timestamp, bytes} so eviction can be decided by
     * cumulative byte size rather than entry count (see MAX_BYTES comment) without re-reading
     * and re-measuring every cached entry on every write - this runs on every insight fetch,
     * including every silent background SWR refresh, so it needs to stay cheap.
     */
    private enforceBudget(scope: { prefix: string }, writtenKey: string, timestamp: number, bytes: number): void {
        this.enforceBudgetMany(scope, [{ key: writtenKey, timestamp, bytes }])
    }

    /**
     * Same eviction logic as enforceBudget(), generalised to update the index and sweep once for
     * a whole batch of newly-written entries instead of once per entry - see setMany()'s doc for
     * why that matters. enforceBudget() above is now a one-entry call into this.
     *
     * Scoped per-account (via `scope.prefix`, which includes the accountId segment) so browsing
     * one account can no longer evict another account's still-valid entries out of this shared
     * MAX_BYTES budget.
     */
    private enforceBudgetMany(scope: { prefix: string }, written: { key: string; timestamp: number; bytes: number }[]): void {
        const writtenKeys = new Set(written.map((w) => w.key))
        const entries = this.readIndex(scope).filter((e) => !writtenKeys.has(e.key))
        entries.push(...written)

        let total = entries.reduce((sum, e) => sum + e.bytes, 0)
        if (total > MAX_BYTES) {
            entries.sort((a, b) => a.timestamp - b.timestamp)
            while (total > MAX_BYTES && entries.length > 1) {
                const evicted = entries.shift()
                if (!evicted) break
                localStorage.removeItem(evicted.key)
                total -= evicted.bytes
            }
        }

        this.safeWrite(this.indexKey(scope), JSON.stringify(entries))
    }
}
