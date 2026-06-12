import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubFetchJson } from '~/test-utils/fetch';
import {
    fogoRpcResponse,
    hyperliquidSpotMeta,
    hyperliquidTokenDetails,
} from '~/test-utils/providerFixtures';
import { ApiEndpoints, useInfoApi } from './useInfoApi';

describe('useInfoApi provider fixtures', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('maps Hyperliquid BTC spot metadata to the UBTC token id', async () => {
        const { fetchMock } = stubFetchJson(hyperliquidSpotMeta());

        await expect(useInfoApi().fetchTokenId('BTC')).resolves.toBe('0xbtc');
        expect(fetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ type: ApiEndpoints.SPOT_META }),
            }),
        );
    });

    it('returns an empty token id for malformed Hyperliquid spot metadata', async () => {
        stubFetchJson({ unexpected: true });

        await expect(useInfoApi().fetchTokenId('BTC')).resolves.toBe('');
    });

    it('normalizes Hyperliquid token detail numeric strings', async () => {
        stubFetchJson(
            hyperliquidTokenDetails({
                midPx: '100000.5',
                markPx: '100100.25',
                prevDayPx: '99000.75',
            }),
        );

        await expect(useInfoApi().fetchTokenDetails('0xbtc')).resolves.toEqual({
            name: 'UBTC',
            maxSupply: 21000000,
            totalSupply: 1000,
            circulatingSupply: 900,
            szDecimals: 5,
            weiDecimals: 8,
            midPx: 100000.5,
            markPx: 100100.25,
            prevDayPx: 99000.75,
        });
    });

    it('keeps Fogo RPC fixture envelopes deterministic for chain boundary tests', () => {
        expect(fogoRpcResponse({ value: 7 }, 'rpc-1')).toEqual({
            jsonrpc: '2.0',
            id: 'rpc-1',
            result: { value: 7 },
        });
    });
});
