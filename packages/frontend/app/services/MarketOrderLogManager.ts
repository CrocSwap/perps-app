import {
    DFLT_EMBER_MARKET,
    getCurrentLogPage,
    getMarketOrderLogInfo,
} from '@crocswap-libs/ambient-ember';
import type { Connection } from '@solana/web3.js';

/**
 * Singleton manager for pre-fetching and caching market order log page
 * This reduces latency when building order transactions
 */
class MarketOrderLogManager {
    private static instance: MarketOrderLogManager | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private isPolling = false;
    private connection: Connection | null = null;
    private cachedLogPage: number | undefined = undefined;
    private lastFetchTime = 0;
    private pollingInterval = 30000; // Poll every 30 seconds
    private subscriberCount = 0;

    private constructor() {}

    static getInstance(): MarketOrderLogManager {
        if (!MarketOrderLogManager.instance) {
            MarketOrderLogManager.instance = new MarketOrderLogManager();
        }
        return MarketOrderLogManager.instance;
    }

    /**
     * Subscribe to market order log updates
     * @param connection Solana connection
     */
    subscribe(connection: Connection): void {
        this.subscriberCount++;

        // Update connection if changed
        if (this.connection !== connection) {
            this.stop();
            this.connection = connection;
        }

        // Start polling if not already active
        if (!this.isPolling && this.connection) {
            this.start();
        }
    }

    /**
     * Unsubscribe from market order log updates
     */
    unsubscribe(): void {
        this.subscriberCount--;

        if (this.subscriberCount <= 0) {
            this.subscriberCount = 0;
            this.stop();
        }
    }

    /**
     * Get the cached market order log page
     * @returns The cached log page number or undefined if not available
     */
    getCachedLogPage(): number | undefined {
        return this.cachedLogPage;
    }

    /**
     * Force an immediate refresh of the market order log page
     */
    async forceRefresh(): Promise<void> {
        if (!this.connection) {
            throw new Error('Cannot refresh: no connection');
        }

        this.lastFetchTime = 0;
        return this.fetchData();
    }

    private start(): void {
        if (this.isPolling || !this.connection) {
            return;
        }

        this.isPolling = true;

        // Clear any existing interval
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
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
        this.cachedLogPage = undefined;
    }

    private async fetchData(): Promise<void> {
        if (!this.connection) {
            return;
        }

        const now = Date.now();
        this.lastFetchTime = now;

        try {
            // Get the market order log info
            const marketId = BigInt(DFLT_EMBER_MARKET.mktId);
            this.cachedLogPage = await getCurrentLogPage(
                this.connection,
                marketId,
            );

            console.log(
                '[MarketOrderLogManager] Updated cached log page:',
                this.cachedLogPage,
            );
        } catch (error) {
            console.error(
                '[MarketOrderLogManager] Error fetching market order log:',
                error,
            );
            // Don't clear the cache on error - keep using the last known value
        }
    }
}

export const marketOrderLogManager = MarketOrderLogManager.getInstance();
