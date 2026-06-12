import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWorkerModule } from '~/test-utils/workerHarness';

describe('orderbook.worker', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts processed order book rows', async () => {
        const worker = await loadWorkerModule(
            '../hooks/workers/orderbook.worker',
        );

        worker.onmessage({
            data: {
                channel: 'l2Book',
                data: {
                    coin: 'BTC',
                    levels: [
                        [{ px: '100', sz: '1', n: 1 }],
                        [{ px: '101', sz: '2', n: 1 }],
                    ],
                },
            },
        } as MessageEvent);

        expect(worker.postMessage).toHaveBeenCalledWith({
            buys: [
                {
                    coin: 'BTC',
                    px: 100,
                    sz: 1,
                    n: 1,
                    type: 'buy',
                    total: 1,
                    ratio: 0.5,
                },
            ],
            sells: [
                {
                    coin: 'BTC',
                    px: 101,
                    sz: 2,
                    n: 1,
                    type: 'sell',
                    total: 2,
                    ratio: 1,
                },
            ],
        });
    });

    it('posts an error envelope for malformed messages', async () => {
        const worker = await loadWorkerModule(
            '../hooks/workers/orderbook.worker',
        );

        worker.onmessage({ data: null } as MessageEvent);

        expect(worker.postMessage).toHaveBeenCalledWith({
            error: expect.any(String),
        });
    });
});
