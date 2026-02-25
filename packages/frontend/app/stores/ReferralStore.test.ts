import { describe, it, expect, beforeEach } from 'vitest';
import { useReferralStore } from './ReferralStore';
import type { CachedRefCodeIF } from './ReferralStore';

// Helper to reset Zustand store state between tests
function resetStore() {
    useReferralStore.setState({
        cached: { code: '', isApproved: false },
        convertedWallets: [],
        totVolume: undefined,
    });
}

describe('ReferralStore – cached refactoring', () => {
    beforeEach(() => {
        resetStore();
    });

    // ─── cache() basics ───────────────────────────────────────

    it('cache() stores code with isApproved=false by default', () => {
        useReferralStore.getState().cache('ben1234');
        const cached = useReferralStore.getState().cached;
        expect(cached.code).toBe('ben1234');
        expect(cached.isApproved).toBe(false);
    });

    it('cache() stores code with isApproved=true when explicitly set', () => {
        useReferralStore.getState().cache('ben1234', true);
        const cached = useReferralStore.getState().cached;
        expect(cached.code).toBe('ben1234');
        expect(cached.isApproved).toBe(true);
    });

    it('cache() with empty code stores empty string', () => {
        useReferralStore.getState().cache('');
        const cached = useReferralStore.getState().cached;
        expect(cached.code).toBe('');
        expect(cached.isApproved).toBe(false);
    });

    // ─── Protection logic ─────────────────────────────────────

    it('unapproved code CAN be overwritten by a different code', () => {
        useReferralStore.getState().cache('codeA');
        expect(useReferralStore.getState().cached.code).toBe('codeA');
        expect(useReferralStore.getState().cached.isApproved).toBe(false);

        useReferralStore.getState().cache('codeB');
        expect(useReferralStore.getState().cached.code).toBe('codeB');
    });

    it('approved code CANNOT be overwritten by a different unapproved code', () => {
        useReferralStore.getState().cache('ben1234', true);
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);

        // Try to overwrite with a different code (unapproved, e.g. from URL)
        useReferralStore.getState().cache('ben4');
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);
    });

    it('approved code CAN be overwritten by a different explicitly approved code', () => {
        useReferralStore.getState().cache('ben1234', true);

        useReferralStore.getState().cache('ben4', true);
        // Explicit approval wins
        expect(useReferralStore.getState().cached.code).toBe('ben4');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);
    });

    it('approved code CAN be re-cached with the SAME code (no-op)', () => {
        useReferralStore.getState().cache('ben1234', true);

        // Same code, unapproved — allowed but downgrades approval
        useReferralStore.getState().cache('ben1234');
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        // Note: isApproved becomes false because same code is allowed through
        expect(useReferralStore.getState().cached.isApproved).toBe(false);
    });

    it('approved code re-cached with same code and isApproved=true stays approved', () => {
        useReferralStore.getState().cache('ben1234', true);

        useReferralStore.getState().cache('ben1234', true);
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);
    });

    // ─── URL param scenario (the original bug) ───────────────

    it('simulates the original bug: URL param should NOT overwrite approved code', () => {
        // User manually enters "ben1234" and it gets approved
        useReferralStore.getState().cache('ben1234', true);
        useReferralStore.getState().markCodeApproved('ben1234');

        // User visits URL with ?af=ben4 (their own code)
        // RefCodeModal calls cache(referralCodeFromURL.value) with default isApproved=false
        useReferralStore.getState().cache('ben4');

        // "ben1234" should still be cached
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);
    });

    // ─── markCodeApproved ─────────────────────────────────────

    it('markCodeApproved sets isApproved=true on cached', () => {
        useReferralStore.getState().cache('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(false);

        useReferralStore.getState().markCodeApproved('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);
    });

    it('markCodeApproved does NOT change cached if code does not match', () => {
        useReferralStore.getState().cache('ben1234');
        useReferralStore.getState().markCodeApproved('differentCode');

        // cached should remain unchanged
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(false);
    });

    // ─── clear() ──────────────────────────────────────────────

    it('clear() resets cached to empty object', () => {
        useReferralStore.getState().cache('ben1234', true);
        useReferralStore.getState().clear();

        expect(useReferralStore.getState().cached.code).toBe('');
        expect(useReferralStore.getState().cached.isApproved).toBe(false);
    });

    // ─── Truthiness checks ────────────────────────────────────

    it('cached object is always truthy (consumers must check .code)', () => {
        // Even with empty code, the object itself is truthy
        const cached = useReferralStore.getState().cached;
        expect(!!cached).toBe(true);
        // But .code is falsy when empty
        expect(!!cached.code).toBe(false);
    });

    it('cached.code is truthy when populated', () => {
        useReferralStore.getState().cache('ben1234');
        expect(!!useReferralStore.getState().cached.code).toBe(true);
    });

    // ─── Migration ────────────────────────────────────────────

    it('migration: string cached → object cached (no approval)', () => {
        // Simulate old localStorage format
        const oldState = {
            cached: 'ben1234',
            convertedWallets: [],
        };

        // Access the persist config to get the migrate function
        const persistOptions = (useReferralStore as any).persist;
        const migrateResult = persistOptions.getOptions().migrate(oldState, 1);

        expect(migrateResult.cached).toEqual({
            code: 'ben1234',
            isApproved: false,
        });
    });

    it('migration: empty string cached → empty object', () => {
        const oldState = {
            cached: '',
            convertedWallets: [],
        };

        const persistOptions = (useReferralStore as any).persist;
        const migrateResult = persistOptions.getOptions().migrate(oldState, 1);

        expect(migrateResult.cached).toEqual({
            code: '',
            isApproved: false,
        });
    });

    it('migration: version 2 state has cached2 stripped', () => {
        const v2State = {
            cached: { code: 'ben1234', isApproved: true },
            cached2: {
                code: 'ben1234',
                isCodeRegistered: true,
                isCodeApprovedByInvitee: true,
            },
            convertedWallets: [],
        };

        const persistOptions = (useReferralStore as any).persist;
        const migrateResult = persistOptions.getOptions().migrate(v2State, 2);

        expect(migrateResult.cached2).toBeUndefined();
        expect(migrateResult.cached).toEqual({
            code: 'ben1234',
            isApproved: true,
        });
    });

    it('migration: version 2 state without cached2 passes through cleanly', () => {
        const v2State = {
            cached: { code: 'ben1234', isApproved: true },
            convertedWallets: [],
        };

        const persistOptions = (useReferralStore as any).persist;
        const migrateResult = persistOptions.getOptions().migrate(v2State, 2);

        expect(migrateResult.cached2).toBeUndefined();
        expect(migrateResult).toEqual(v2State);
    });

    it('migration: version 3 state is returned as-is', () => {
        const v3State = {
            cached: { code: 'ben1234', isApproved: true },
            convertedWallets: [],
        };

        const persistOptions = (useReferralStore as any).persist;
        const migrateResult = persistOptions.getOptions().migrate(v3State, 3);

        expect(migrateResult).toEqual(v3State);
    });

    it('migration: v1 state with cached2 has it stripped', () => {
        const oldState = {
            cached: 'ben1234',
            cached2: {
                code: 'ben1234',
                isCodeRegistered: true,
                isCodeApprovedByInvitee: true,
            },
            convertedWallets: [],
        };

        const persistOptions = (useReferralStore as any).persist;
        const migrateResult = persistOptions.getOptions().migrate(oldState, 1);

        expect(migrateResult.cached2).toBeUndefined();
        expect(migrateResult.cached).toEqual({
            code: 'ben1234',
            isApproved: false,
        });
    });

    // ─── Modal accept with pre-existing approved code ─────────

    it('accepting a new URL code in modal overwrites a previously approved code', () => {
        // User previously approved "oldCode"
        useReferralStore.getState().cache('oldCode', true);
        expect(useReferralStore.getState().cached.code).toBe('oldCode');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);

        // User visits ?af=ben1234 — passive cache is blocked
        useReferralStore.getState().cache('ben1234');
        expect(useReferralStore.getState().cached.code).toBe('oldCode');

        // User clicks "Accept" in modal → cache(ben1234, true)
        useReferralStore.getState().cache('ben1234', true);
        expect(useReferralStore.getState().cached.code).toBe('ben1234');
        expect(useReferralStore.getState().cached.isApproved).toBe(true);
    });

    // ─── Full workflow simulation ─────────────────────────────

    it('full workflow: URL → modal accept → URL with different code', () => {
        // Step 1: User visits with ?af=ben1234 (RefCodeModal caches it)
        useReferralStore.getState().cache('ben1234'); // isApproved=false
        expect(useReferralStore.getState().cached).toEqual({
            code: 'ben1234',
            isApproved: false,
        });

        // Step 2: User clicks "Accept" in modal → markCodeApproved
        useReferralStore.getState().markCodeApproved('ben1234');
        expect(useReferralStore.getState().cached).toEqual({
            code: 'ben1234',
            isApproved: true,
        });

        // Step 3: User visits with ?af=ben4 (their own code in URL)
        useReferralStore.getState().cache('ben4'); // isApproved=false
        // Protection: ben1234 is approved, ben4 is different → blocked
        expect(useReferralStore.getState().cached).toEqual({
            code: 'ben1234',
            isApproved: true,
        });
    });

    it('full workflow: manual entry overwrites URL-cached code', () => {
        // Step 1: User visits with ?af=codeA
        useReferralStore.getState().cache('codeA');
        expect(useReferralStore.getState().cached.code).toBe('codeA');

        // Step 2: User manually enters "codeB" in the input (approved)
        useReferralStore.getState().cache('codeB', true);
        expect(useReferralStore.getState().cached).toEqual({
            code: 'codeB',
            isApproved: true,
        });
    });

    it('full workflow: clear and start fresh', () => {
        useReferralStore.getState().cache('ben1234', true);
        useReferralStore.getState().markCodeApproved('ben1234');

        useReferralStore.getState().clear();
        expect(useReferralStore.getState().cached).toEqual({
            code: '',
            isApproved: false,
        });

        // Can now cache a new code
        useReferralStore.getState().cache('newCode');
        expect(useReferralStore.getState().cached.code).toBe('newCode');
    });
});
