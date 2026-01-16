import { describe, expect, test } from 'vitest';

import {
    BTC_MARKET_ID,
    getMarketNameById,
    getMarketNameByIdOrFallback,
} from './marketIdToName';

describe('marketIdToName', () => {
    test('resolves BTC by bigint', () => {
        expect(getMarketNameById(BTC_MARKET_ID)).toBe('BTC');
        expect(getMarketNameById(64n)).toBe('BTC');
    });

    test('resolves BTC by number', () => {
        expect(getMarketNameById(64)).toBe('BTC');
    });

    test('resolves BTC by string (with whitespace)', () => {
        expect(getMarketNameById('64')).toBe('BTC');
        expect(getMarketNameById(' 64 ')).toBe('BTC');
    });

    test('returns undefined for unknown market IDs', () => {
        expect(getMarketNameById(999n)).toBeUndefined();
        expect(getMarketNameById(999)).toBeUndefined();
        expect(getMarketNameById('999')).toBeUndefined();
    });

    test('fallback helper returns UNKNOWN by default', () => {
        expect(getMarketNameByIdOrFallback(999n)).toBe('UNKNOWN');
    });

    test('fallback helper respects a custom fallback value', () => {
        expect(getMarketNameByIdOrFallback(999n, 'N/A')).toBe('N/A');
    });

    test('invalid inputs are treated as unknown', () => {
        expect(getMarketNameByIdOrFallback('')).toBe('UNKNOWN');
        expect(getMarketNameByIdOrFallback('   ')).toBe('UNKNOWN');
        expect(getMarketNameByIdOrFallback('not-a-number')).toBe('UNKNOWN');
        expect(getMarketNameByIdOrFallback(Number.NaN)).toBe('UNKNOWN');
        expect(getMarketNameByIdOrFallback(12.34)).toBe('UNKNOWN');
        expect(getMarketNameByIdOrFallback(Number.POSITIVE_INFINITY)).toBe(
            'UNKNOWN',
        );
    });
});
