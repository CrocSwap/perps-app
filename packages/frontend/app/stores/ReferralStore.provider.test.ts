import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeJsonResponse, stubFetchJson } from '~/test-utils/fetch';
import { fuulAffiliateCode, fuulReferrer } from '~/test-utils/providerFixtures';
import { useReferralStore } from './ReferralStore';

describe('ReferralStore provider boundaries', () => {
    beforeEach(() => {
        useReferralStore.setState({
            cached: { code: '', isApproved: false, approvalNonce: 0 },
            convertedWallets: [],
            totVolume: undefined,
            claims: null,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('fetches affiliate code data and throws on non-OK responses', async () => {
        const affiliateCode = fuulAffiliateCode({
            codes: [{ code: 'abc', createdAt: '2026-06-12T00:00:00.000Z' }],
        });
        const { fetchMock } = stubFetchJson(affiliateCode);

        await expect(
            useReferralStore.getState().getRefCodeByPubKey('wallet-1'),
        ).resolves.toEqual(affiliateCode);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/affiliates/wallet-1'),
            expect.objectContaining({
                method: 'GET',
                signal: expect.any(AbortSignal),
            }),
        );

        stubFetchJson({ error: 'nope' }, { ok: false, status: 404 });
        await expect(
            useReferralStore.getState().getRefCodeByPubKey('missing-wallet'),
        ).rejects.toThrow('HTTP 404');
    });

    it('checks conversion across both Fuul programs and reuses persisted positives', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(makeJsonResponse(fuulReferrer()))
                .mockResolvedValueOnce(
                    makeJsonResponse(
                        fuulReferrer({
                            user_identifier: 'wallet-1',
                            referrer_identifier: 'referrer',
                            referrer_code: 'ref-code',
                        }),
                    ),
                ),
        );

        await expect(
            useReferralStore.getState().checkForConversion('wallet-1'),
        ).resolves.toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);

        useReferralStore.setState({ convertedWallets: ['wallet-2'] });
        await expect(
            useReferralStore.getState().checkForConversion('wallet-2'),
        ).resolves.toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('stores claims arrays and falls back to empty claims on fetch failure', async () => {
        stubFetchJson({ claims: [{ amount: '1' }] });
        await useReferralStore.getState().fetchClaims('wallet-1');
        expect(useReferralStore.getState().claims).toEqual([{ amount: '1' }]);

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        await useReferralStore.getState().fetchClaims('wallet-1');
        expect(useReferralStore.getState().claims).toEqual([]);
    });

    it('normalizes malformed, empty, and rate-limited referrer responses per program', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValueOnce(makeJsonResponse({ unexpected: true }))
                .mockResolvedValueOnce(
                    makeJsonResponse(
                        { error: 'rate limited' },
                        { ok: false, status: 429 },
                    ),
                ),
        );

        await expect(
            useReferralStore.getState().fetchUserReferrer('wallet-1'),
        ).resolves.toEqual([
            fuulReferrer({ user_identifier: 'wallet-1' }),
            fuulReferrer({ user_identifier: 'wallet-1' }),
        ]);
    });

    it('keeps conversion checks alive when one Fuul program throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockRejectedValueOnce(new Error('offline'))
                .mockResolvedValueOnce(
                    makeJsonResponse(
                        fuulReferrer({
                            user_identifier: 'wallet-1',
                            referrer_identifier: 'referrer',
                        }),
                    ),
                ),
        );

        await expect(
            useReferralStore.getState().checkForConversion('wallet-1'),
        ).resolves.toBe(true);
    });

    it('falls back to empty referrers when Fuul requests time out', async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
            'fetch',
            vi.fn((_url: string, init?: RequestInit) => {
                return new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'));
                    });
                });
            }),
        );

        const resultPromise = useReferralStore
            .getState()
            .fetchUserReferrer('wallet-timeout');
        await vi.advanceTimersByTimeAsync(10_000);

        await expect(resultPromise).resolves.toEqual([
            fuulReferrer({ user_identifier: 'wallet-timeout' }),
            fuulReferrer({ user_identifier: 'wallet-timeout' }),
        ]);
    });

    it('does not call claims provider for empty addresses and normalizes unexpected payloads', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await useReferralStore.getState().fetchClaims('');
        expect(fetchMock).not.toHaveBeenCalled();
        expect(useReferralStore.getState().claims).toBeNull();

        stubFetchJson({ claims: { amount: 'not-array' }, data: null });
        await useReferralStore.getState().fetchClaims('wallet-1');
        expect(useReferralStore.getState().claims).toEqual([]);
    });
});
