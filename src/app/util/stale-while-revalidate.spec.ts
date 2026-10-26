import { throwError, of } from 'rxjs'
import { SwrCache, withStaleWhileRevalidate } from './stale-while-revalidate'

/**
 * First coverage for this shared helper (used by dashboard, settings, and main-users-list effects).
 * Added per USERS_TABLE_ERROR_HANDLING_PLAN.md Phase 6 to pin down the one deliberate asymmetry in
 * its error handling: a cold-cache miss failure dispatches a real `toFailureAction`, but a *silent
 * background* revalidation failure is always swallowed into nothing - on purpose, since the cached
 * value is already showing and there's nothing new to tell the user. Getting this backwards (or
 * accidentally "fixing" it) would either resurrect the stuck-loading-flag bug class on a cold miss,
 * or spam a toast every time a background refresh has a transient blip while a cached value is
 * already rendering correctly.
 */
describe('withStaleWhileRevalidate', () => {
    const key = 'test-key'
    const toSuccessAction = (payload: any, isBackgroundRefresh: boolean) => ({ type: 'SUCCESS', payload, isBackgroundRefresh })
    const toFailureAction = (error: any) => ({ type: 'FAILURE', error })

    function collect(source$: any): any[] {
        const results: any[] = []
        source$.subscribe((action: any) => results.push(action))
        return results
    }

    it('cold-cache miss failure: dispatches the real toFailureAction, not nothing', () => {
        const cache: SwrCache<any> = { get: () => ({ status: 'miss' }), setIfChanged: () => true }
        const fetchLive = () => throwError(() => new Error('Server error'))

        const results = collect(withStaleWhileRevalidate(key, cache, new Set(), fetchLive, toSuccessAction, toFailureAction))

        expect(results.length).toBe(1)
        expect(results[0].type).toBe('FAILURE')
        expect(results[0].error.message).toBe('Server error')
    })

    it('cold-cache miss failure with no toFailureAction supplied: swallows into EMPTY (opt-in legacy behavior)', () => {
        const cache: SwrCache<any> = { get: () => ({ status: 'miss' }), setIfChanged: () => true }
        const fetchLive = () => throwError(() => new Error('Server error'))

        const results = collect(withStaleWhileRevalidate(key, cache, new Set(), fetchLive, toSuccessAction))

        expect(results.length).toBe(0)
    })

    it('warm cache: emits the cached success immediately, then swallows a background-refresh failure into nothing - the deliberate asymmetry', (done) => {
        const cache: SwrCache<any> = { get: () => ({ status: 'fresh', data: { cached: true } }), setIfChanged: () => true }
        const fetchLive = () => throwError(() => new Error('Background refresh blip'))

        const results = collect(withStaleWhileRevalidate(key, cache, new Set(), fetchLive, toSuccessAction, toFailureAction))

        // The cached emission is scheduled on a microtask (asapScheduler) - wait a tick so both the
        // cached success and the (swallowed) background refresh have had a chance to emit.
        setTimeout(() => {
            expect(results.length).toBe(1)
            expect(results[0].type).toBe('SUCCESS')
            expect(results[0].payload).toEqual({ cached: true })
            expect(results[0].isBackgroundRefresh).toBe(false)
            done()
        }, 0)
    })

    it('warm cache: emits a second success for a background refresh that resolves with genuinely changed data', (done) => {
        const cache: SwrCache<any> = { get: () => ({ status: 'stale', data: { cached: true } }), setIfChanged: () => true }
        const fetchLive = () => of({ refreshed: true })

        const results = collect(withStaleWhileRevalidate(key, cache, new Set(), fetchLive, toSuccessAction, toFailureAction))

        // cachedAction$ is scheduled on a microtask (asapScheduler) while a synchronous fetchLive's
        // backgroundRefresh$ emits immediately on subscribe - so the background refresh can land
        // before the cached emission. Assert on content, not emission order.
        setTimeout(() => {
            expect(results.length).toBe(2)
            const cachedEmission = results.find((r) => !r.isBackgroundRefresh)
            const refreshEmission = results.find((r) => r.isBackgroundRefresh)
            expect(cachedEmission.payload).toEqual({ cached: true })
            expect(refreshEmission.payload).toEqual({ refreshed: true })
            done()
        }, 0)
    })
})
