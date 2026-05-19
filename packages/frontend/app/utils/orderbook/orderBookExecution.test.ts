import { describe, expect, it, vi, afterEach } from 'vitest';
import type { OrderBookRowIF } from './OrderBookIFs';

const importExecution = async () => {
    return await import('./orderBookExecution');
};

const row = (px: number): OrderBookRowIF => ({
    coin: 'BTC',
    px,
    sz: 1,
    n: 1,
    type: 'buy',
    total: 1,
});

describe('getMarketExecutionPrice', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns top of book when data is fresh', async () => {
        const { getMarketExecutionPrice } = await importExecution();
        vi.useFakeTimers();
        vi.setSystemTime(1_000_000);
        const now = Date.now();

        expect(
            getMarketExecutionPrice('buy', [row(99)], [row(101)], now),
        ).toEqual({ price: 101 });
        expect(
            getMarketExecutionPrice('sell', [row(99)], [row(101)], now),
        ).toEqual({ price: 99 });
    });

    it('rejects stale books', async () => {
        const { getMarketExecutionPrice } = await importExecution();
        vi.useFakeTimers();
        vi.setSystemTime(20_000);

        expect(getMarketExecutionPrice('buy', [], [row(101)], 0)).toEqual({
            error: 'stale',
        });
    });

    it('rejects empty sides', async () => {
        const { getMarketExecutionPrice } = await importExecution();
        vi.useFakeTimers();
        vi.setSystemTime(1_000_000);
        const now = Date.now();

        expect(getMarketExecutionPrice('buy', [], [], now)).toEqual({
            error: 'no_asks',
        });
        expect(getMarketExecutionPrice('sell', [], [], now)).toEqual({
            error: 'no_bids',
        });
    });
});
