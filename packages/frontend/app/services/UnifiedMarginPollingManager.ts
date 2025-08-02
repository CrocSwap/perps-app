import {
    DFLT_EMBER_MARKET,
    getUserMarginBucket,
    USD_MINT,
} from '@crocswap-libs/ambient-ember';
import type { Connection, PublicKey } from '@solana/web3.js';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUnifiedMarginStore } from '~/stores/UnifiedMarginStore';
import { convertMarginBucketToPosition } from '~/utils/convertMarginBucketToPosition';
import type { UserBalanceIF } from '~/utils/UserDataIFs';

/**
 * Singleton manager for unified margin polling
 * This ensures only one polling instance exists globally
 */
class UnifiedMarginPollingManager {
    private static instance: UnifiedMarginPollingManager | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private isPolling = false;
    private connection: Connection | null = null;
    private walletPublicKey: PublicKey | null = null;
    private subscriberCount = 0;
    private lastFetchTime = 0;
    private minFetchInterval = 900; // Minimum time between fetches in ms
    private pollingInterval = 1000; // Poll every 1 second

    private constructor() {}

    static getInstance(): UnifiedMarginPollingManager {
        if (!UnifiedMarginPollingManager.instance) {
            UnifiedMarginPollingManager.instance =
                new UnifiedMarginPollingManager();
        }
        return UnifiedMarginPollingManager.instance;
    }

    subscribe(connection: Connection, walletPublicKey: PublicKey): void {
        this.subscriberCount++;

        // Update connection info if changed
        const walletChanged =
            this.walletPublicKey?.toString() !== walletPublicKey.toString();
        if (walletChanged) {
            this.stop();
        }

        this.connection = connection;
        this.walletPublicKey = walletPublicKey;

        // Start polling if not already active
        if (!this.isPolling) {
            this.start();
        }
    }

    unsubscribe(): void {
        this.subscriberCount--;

        if (this.subscriberCount <= 0) {
            this.subscriberCount = 0; // Ensure it doesn't go negative
            this.stop();
        }
    }

    private start(): void {
        if (this.isPolling || !this.connection || !this.walletPublicKey) {
            return;
        }

        this.isPolling = true;

        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Don't set loading if we already have data
        const store = useUnifiedMarginStore.getState();
        if (!store.marginBucket && store.lastUpdateTime === 0) {
            store.setIsLoading(true);
        }

        // Initial fetch
        this.fetchData();

        // Set up polling
        this.intervalId = setInterval(() => {
            this.fetchData();
        }, this.pollingInterval);
    }

    private stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isPolling = false;

        // Clear data when stopping - do it asynchronously to avoid React render issues
        setTimeout(() => {
            const store = useUnifiedMarginStore.getState();
            store.setMarginBucket(null);
            store.setBalance(null);
            store.setPositions([]);
            store.setError(null);
            store.setIsLoading(true);
            store.setLastUpdateTime(0);
        }, 0);
    }

    private async fetchData(): Promise<void> {
        if (!this.connection || !this.walletPublicKey) {
            return;
        }

        // Prevent fetching too frequently
        const now = Date.now();
        if (now - this.lastFetchTime < this.minFetchInterval) {
            return;
        }
        this.lastFetchTime = now;

        try {
            const marginBucket = await getUserMarginBucket(
                this.connection,
                this.walletPublicKey,
                BigInt(DFLT_EMBER_MARKET.mktId),
                USD_MINT,
                {},
            );

            if (!marginBucket) {
                throw new Error('No margin bucket found');
            }

            // Convert to balance format
            const committedCollateral =
                Number(marginBucket.committedCollateral || 0n) /
                Math.pow(10, 6);
            const availToWithdraw =
                Number(marginBucket.availToWithdraw || 0n) / Math.pow(10, 6);
            const hold = committedCollateral - availToWithdraw;

            const balance: UserBalanceIF = {
                coin: 'fUSD',
                type: 'margin',
                total: committedCollateral,
                available: availToWithdraw,
                hold: hold,
                entryNtl: 0,
                sortName: '\x01',
                usdcValue: committedCollateral,
                pnlValue: 0,
                metaIndex: 0,
                buyingPower: availToWithdraw,
                contractAddress: 'fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry',
            };

            const symbolInfo = useTradeDataStore.getState().symbolInfo;

            // Convert to position format
            const position = convertMarginBucketToPosition(
                marginBucket,
                BigInt(DFLT_EMBER_MARKET.mktId),
                symbolInfo,
            );

            // Update store
            const store = useUnifiedMarginStore.getState();
            store.setMarginBucket(marginBucket);
            store.setBalance(balance);
            store.setPositions(position ? [position] : []);
            store.setError(null);
            store.setIsLoading(false);
            store.setLastUpdateTime(Date.now());
        } catch (error) {
            const store = useUnifiedMarginStore.getState();
            store.setError(
                error instanceof Error ? error.message : 'Unknown error',
            );
            store.setIsLoading(false);
        }
    }

    async forceRefresh(): Promise<void> {
        if (!this.connection || !this.walletPublicKey) {
            throw new Error('Cannot refresh: no connection or wallet');
        }

        // Reset last fetch time to allow immediate fetch
        this.lastFetchTime = 0;
        return this.fetchData();
    }
}

export const unifiedMarginPollingManager =
    UnifiedMarginPollingManager.getInstance();
