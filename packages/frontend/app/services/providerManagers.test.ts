import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Connection } from '@solana/web3.js';
import { TEST_PUBLIC_KEYS } from '~/test-utils/solana';
import { useUnifiedMarginStore } from '~/stores/UnifiedMarginStore';
import { pythPriceUpdate } from '~/test-utils/providerFixtures';

const managerMocks = vi.hoisted(() => ({
    getCurrentLogPage: vi.fn(async () => 7),
    getUserMarginBucket: vi.fn(async () => null),
    getLatestPriceUpdates: vi.fn(async () =>
        pythPriceUpdate({
            publish_time: String(Math.floor(Date.now() / 1000)),
        }),
    ),
}));

vi.mock('@crocswap-libs/ambient-ember', () => ({
    DFLT_EMBER_MARKET: { mktId: 64 },
    USD_MINT: 'USD_MINT',
    getCurrentLogPage: managerMocks.getCurrentLogPage,
    getMarketOrderLogInfo: vi.fn(),
    getUserMarginBucket: managerMocks.getUserMarginBucket,
}));

vi.mock('@pythnetwork/hermes-client', () => ({
    HermesClient: vi.fn(function HermesClient() {
        return {
            getLatestPriceUpdates: managerMocks.getLatestPriceUpdates,
        };
    }),
}));

vi.mock('~/utils/convertMarginBucketToPosition', () => ({
    convertMarginBucketToPosition: vi.fn(() => null),
}));

const { marketOrderLogManager } = await import('./MarketOrderLogManager');
const { unifiedMarginPollingManager } =
    await import('./UnifiedMarginPollingManager');
const { NotificationService } = await import('./notificationService');
const { PythPriceService } = await import('./pythPriceService');

const connection = new Connection('http://127.0.0.1:8899');

describe('provider and polling managers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-12T00:00:00Z'));
        vi.clearAllMocks();
        useUnifiedMarginStore.setState({
            marginBucket: null,
            balance: null,
            positions: [],
            isLoading: true,
            error: null,
            lastUpdateTime: 0,
            refreshPromise: null,
        });
    });

    afterEach(() => {
        marketOrderLogManager.unsubscribe();
        unifiedMarginPollingManager.unsubscribe();
        PythPriceService.getInstance().destroy();
        vi.useRealTimers();
    });

    it('caches market order log pages and clears cache when unsubscribed', async () => {
        marketOrderLogManager.subscribe(connection);
        await vi.runOnlyPendingTimersAsync();
        await marketOrderLogManager.forceRefresh();

        expect(managerMocks.getCurrentLogPage).toHaveBeenCalledWith(
            connection,
            64n,
        );
        expect(marketOrderLogManager.getCachedLogPage()).toBe(7);

        marketOrderLogManager.unsubscribe();
        expect(marketOrderLogManager.getCachedLogPage()).toBeUndefined();
    });

    it('updates unified margin store for empty buckets and resets on unsubscribe', async () => {
        unifiedMarginPollingManager.subscribe(
            connection,
            TEST_PUBLIC_KEYS.user,
        );
        await unifiedMarginPollingManager.forceRefresh();

        expect(managerMocks.getUserMarginBucket).toHaveBeenCalledWith(
            connection,
            TEST_PUBLIC_KEYS.user,
            64n,
            'USD_MINT',
            {},
        );
        expect(useUnifiedMarginStore.getState().balance).toMatchObject({
            coin: 'fUSD',
            total: 0,
            available: 0,
        });
        expect(useUnifiedMarginStore.getState().isLoading).toBe(false);

        unifiedMarginPollingManager.unsubscribe();
        await vi.runOnlyPendingTimersAsync();
        expect(useUnifiedMarginStore.getState()).toMatchObject({
            balance: null,
            positions: [],
            error: null,
            isLoading: true,
            lastUpdateTime: 0,
        });
    });

    it('auto-removes non-persistent notifications and supports unsubscribe', async () => {
        const service = new NotificationService();
        const listener = vi.fn();
        const unsubscribe = service.subscribe(listener);

        service.addNotification('n1', {
            type: 'info',
            title: 'Title',
            message: 'Message',
            duration: 100,
        });
        expect(service.getNotifications()).toHaveLength(1);
        expect(listener).toHaveBeenLastCalledWith([
            expect.objectContaining({ title: 'Title' }),
        ]);

        await vi.advanceTimersByTimeAsync(100);
        expect(service.getNotifications()).toHaveLength(0);

        unsubscribe();
        service.addNotification('n2', {
            type: 'success',
            title: 'Silent',
            message: 'After unsubscribe',
            persistent: true,
        });
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('polls Pyth prices, notifies subscribers, and cleans up timers', async () => {
        const service = PythPriceService.getInstance();
        const priceListener = vi.fn();
        const statusListener = vi.fn();
        service.onPriceUpdate(priceListener);
        service.onConnectionStatusChange(statusListener);

        await service.subscribeToSymbol('BTC');
        await vi.advanceTimersByTimeAsync(1000);

        expect(statusListener).toHaveBeenCalledWith(true);
        expect(priceListener).toHaveBeenCalledWith(
            'BTC',
            expect.objectContaining({
                price: 100,
                confidence: 0.1,
                symbol: 'BTC',
                isStale: false,
            }),
        );
        expect(service.getCachedPrice('BTC')).toMatchObject({ price: 100 });

        service.unsubscribeFromSymbol('BTC');
        expect(service.getCachedPrice('BTC')).toBeUndefined();
        service.destroy();
    });

    it('contains malformed Pyth payloads without notifying subscribers', async () => {
        const errorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
        managerMocks.getLatestPriceUpdates.mockResolvedValueOnce({
            parsed: [{ unexpected: true } as never],
        });
        const service = PythPriceService.getInstance();
        const priceListener = vi.fn();
        service.onPriceUpdate(priceListener);

        await service.subscribeToSymbol('BTC');
        await Promise.resolve();
        await Promise.resolve();

        expect(priceListener).not.toHaveBeenCalled();
        expect(service.getCachedPrice('BTC')).toBeUndefined();
        expect(errorSpy).toHaveBeenCalledWith(
            '[PythPriceService] Test fetch error:',
            expect.any(Error),
        );

        errorSpy.mockRestore();
    });

    it('marks Pyth disconnected after monitor rate-limit-style failures', async () => {
        const errorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);
        managerMocks.getLatestPriceUpdates.mockRejectedValueOnce(
            new Error('rate limited'),
        );
        const service = PythPriceService.getInstance();
        const statusListener = vi.fn();
        service.onConnectionStatusChange(statusListener);

        await vi.advanceTimersByTimeAsync(5000);

        expect(statusListener).toHaveBeenCalledWith(true);
        expect(statusListener).toHaveBeenCalledWith(false);
        expect(service.getConnectionStatus()).toBe(false);
        expect(errorSpy).toHaveBeenCalledWith(
            '🔴 Pyth connection lost:',
            expect.any(Error),
        );

        errorSpy.mockRestore();
    });
});
