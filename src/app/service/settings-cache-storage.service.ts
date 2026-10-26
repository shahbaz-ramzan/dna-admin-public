import { Injectable } from '@angular/core'
import K from '../constants'
import Encryption from '../util/Encryption'

// Most Settings reads are account-scoped and change only on an explicit mutation - matches the
// TTL/fresh-window standard used by Dashboard/Users/Insights caches.
export const SETTINGS_LOCAL_CACHE_TTL_MS = 30 * 60 * 1000
export const SETTINGS_LOCAL_CACHE_FRESH_MS = 15 * 60 * 1000
// Reference data (languages, labels, role types) that essentially never changes - long TTL so it
// isn't silently re-fetched on every session.
export const SETTINGS_STATIC_CACHE_TTL_MS = 24 * 60 * 60 * 1000
export const SETTINGS_STATIC_CACHE_FRESH_MS = 60 * 60 * 1000

const CACHE_VERSION = 1
const KEY_PREFIX = 'settings'
// Settings has ~25 cacheable scopes (some with a handful of variants, e.g. per-status user
// lists) - cap total entries per user/account so variant churn can't grow localStorage unbounded.
const MAX_ENTRIES_PER_ACCOUNT = 40
// Bucket for global/account-less scopes (languages, labels, role types, all-accounts list).
const GLOBAL_BUCKET = '_'

interface CacheEntry<T> {
    data: T
    timestamp: number
    version: number
    userId: string
    accountId: string
}

export type SettingsCacheStatus = 'fresh' | 'stale' | 'miss'

export interface SettingsCacheResult<T> {
    status: SettingsCacheStatus
    data?: T
}

export interface SettingsCacheTtl {
    ttlMs: number
    freshMs: number
}

function stableStringify(value: any): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value)
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
    const keys = Object.keys(value).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`
}

// djb2 - deterministic, short, good enough to disambiguate scope variants (not a security hash).
function hash(str: string): string {
    let h = 5381
    for (let i = 0; i < str.length; i++) {
        h = (h * 33) ^ str.charCodeAt(i)
    }
    return (h >>> 0).toString(36)
}

/**
 * Per-user, per-account, TTL-scoped localStorage cache for the Settings page - mirrors
 * UsersCacheStorageService/DashboardCacheStorageService/ParticipantInsightsCacheStorageService
 * (same read/write/version/quota-fallback shape), but keyed by a named `scope` (one per Settings
 * read, e.g. 'legalText', 'manageTags') plus an optional `variant` payload (e.g. {status} for the
 * per-status users list) instead of a single fixed widget key or a fully-hashed request payload.
 *
 * accountId is a literal segment of the key AND re-validated on read - see
 * ACCOUNT_ID_CACHE_KEY_FIX_PLAN.md for why an unscoped key here is a correctness bug (rendering
 * one account's legal text/subscription/etc under another), not just a staleness one. Global
 * reference data (languages, participant/user labels, role types, all-accounts) uses the fixed
 * GLOBAL_BUCKET account segment since it isn't account-specific.
 *
 * purgeScopes() purges by key *prefix*, so a scope name must never itself be a prefix of another
 * scope name (e.g. 'user' and 'userRole') - keep scope names distinct, not overlapping.
 */
@Injectable({
    providedIn: 'root',
})
export class SettingsCacheStorageService {
    private getUserId(): string {
        const decrypted = Encryption.decryptData(localStorage.getItem(K.APP.USER_OBJECT) || '')
        if (!decrypted) return ''
        try {
            return JSON.parse(decrypted)?.personId ?? ''
        } catch {
            return ''
        }
    }

    /** Deterministic cache key for a named Settings read, scoped to account and optional variant. */
    buildKey(scope: string, accountId?: string | number, variant?: any): string {
        const userId = this.getUserId()
        const account = accountId === undefined || accountId === null || accountId === '' ? GLOBAL_BUCKET : String(accountId)
        const variantSuffix = variant === undefined ? '' : `:${hash(stableStringify(variant))}`
        return `${KEY_PREFIX}:${userId}:${account}:${scope}${variantSuffix}`
    }

    get<T>(key: string, ttl: SettingsCacheTtl = { ttlMs: SETTINGS_LOCAL_CACHE_TTL_MS, freshMs: SETTINGS_LOCAL_CACHE_FRESH_MS }): SettingsCacheResult<T> {
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
        if (age > ttl.ttlMs) return { status: 'miss' }

        return { status: age < ttl.freshMs ? 'fresh' : 'stale', data: entry.data }
    }

    set<T>(key: string, data: T, accountId?: string | number): void {
        const userId = this.getUserId()
        if (!userId) return

        const account = accountId === undefined || accountId === null || accountId === '' ? GLOBAL_BUCKET : String(accountId)
        const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId, accountId: account }
        this.safeWrite(key, JSON.stringify(entry))
        this.enforceCap(userId, account, key, entry.timestamp)
    }

    /** Same semantics as UsersCacheStorageService.setIfChanged - see its comment. */
    setIfChanged<T>(key: string, data: T, accountId?: string | number): boolean {
        const userId = this.getUserId()
        if (!userId) return false

        const account = accountId === undefined || accountId === null || accountId === '' ? GLOBAL_BUCKET : String(accountId)
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

        const entry: CacheEntry<T> = { data, timestamp: Date.now(), version: CACHE_VERSION, userId, accountId: account }
        this.safeWrite(key, JSON.stringify(entry))
        this.enforceCap(userId, account, key, entry.timestamp)

        return changed
    }

    /**
     * Returns an SwrCache-compatible view bound to a fixed accountId, so effect call sites don't
     * have to thread accountId through setIfChanged() themselves. `ttl` lets a caller opt into the
     * long static TTL for reference-data scopes without a second service.
     */
    scopedTo(accountId?: string | number, ttl?: SettingsCacheTtl) {
        return {
            get: <T>(key: string) => this.get<T>(key, ttl),
            setIfChanged: <T>(key: string, data: T) => this.setIfChanged<T>(key, data, accountId),
        }
    }

    /**
     * Best-effort localStorage write - see UsersCacheStorageService.safeWrite for the full
     * rationale (a quota error must degrade to no-cache, never fail the caller's HTTP success).
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

    /** Removes every cached Settings entry belonging to userId. */
    clear(userId: string): void {
        if (!userId) return
        const prefix = `${KEY_PREFIX}:${userId}:`
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(prefix)) localStorage.removeItem(key)
        }
    }

    /** Convenience wrapper for logout call sites - must run before anything wipes K.APP.USER_OBJECT. */
    clearForCurrentUser(): void {
        this.clear(this.getUserId())
    }

    /** Removes every cached Settings entry for one account (e.g. on account switch, if ever needed). */
    purgeAccount(accountId?: string | number): void {
        const userId = this.getUserId()
        if (!userId) return
        const account = accountId === undefined || accountId === null || accountId === '' ? GLOBAL_BUCKET : String(accountId)
        const prefix = `${KEY_PREFIX}:${userId}:${account}:`
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key?.startsWith(prefix)) localStorage.removeItem(key)
        }
    }

    /**
     * Removes every cached entry for the given scopes within one account (all variants included,
     * since a variant suffix is appended after the scope name). This is the main invalidation
     * tool for Settings mutations - see SETTINGS_PAGE_CACHE_PLAN.md §4 for the mutation → scopes
     * table. Scoped to `accountId` so editing one account's tags never evicts another account's
     * still-fresh cache.
     */
    purgeScopes(accountId: string | number | undefined, scopes: string[]): void {
        const userId = this.getUserId()
        if (!userId || scopes.length === 0) return
        const account = accountId === undefined || accountId === null || accountId === '' ? GLOBAL_BUCKET : String(accountId)
        const prefixes = scopes.map((scope) => `${KEY_PREFIX}:${userId}:${account}:${scope}`)
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && prefixes.some((p) => key.startsWith(p))) localStorage.removeItem(key)
        }
    }

    private indexKey(userId: string, accountId: string): string {
        return `${KEY_PREFIX}:${userId}:${accountId}:__index`
    }

    private readIndex(userId: string, accountId: string): { key: string; timestamp: number }[] {
        try {
            return JSON.parse(localStorage.getItem(this.indexKey(userId, accountId)) || '[]')
        } catch {
            return []
        }
    }

    /**
     * Keeps a small per-user, per-account index of {key, timestamp} instead of scanning the whole
     * localStorage keyspace on every write - see UsersCacheStorageService.enforceCap for the same
     * rationale (this runs on every Settings fetch, including silent background SWR refreshes).
     */
    private enforceCap(userId: string, accountId: string, writtenKey: string, timestamp: number): void {
        const entries = this.readIndex(userId, accountId)

        if (entries.some((e) => e.key === writtenKey)) return

        entries.push({ key: writtenKey, timestamp })

        if (entries.length > MAX_ENTRIES_PER_ACCOUNT) {
            entries.sort((a, b) => a.timestamp - b.timestamp)
            const excess = entries.length - MAX_ENTRIES_PER_ACCOUNT
            for (let i = 0; i < excess; i++) localStorage.removeItem(entries[i].key)
            entries.splice(0, excess)
        }

        this.safeWrite(this.indexKey(userId, accountId), JSON.stringify(entries))
    }
}
