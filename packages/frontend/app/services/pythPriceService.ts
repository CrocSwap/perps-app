import { HermesClient } from '@pythnetwork/hermes-client';
import {
    PYTH_ENDPOINT,
    PYTH_PRICE_FEEDS,
    PRICE_STALENESS_THRESHOLD,
    getPriceFeedId,
} from '~/utils/pythConfig';

export interface PythPriceData {
    price: number;
    confidence: number;
    publishTime: number;
    symbol: string;
    isStale: boolean;
}

export type PriceUpdateCallback = (
    symbol: string,
    priceData: PythPriceData,
) => void;
export type ConnectionStatusCallback = (isConnected: boolean) => void;

/**
 * Service for managing Pyth price feed connections and subscriptions
 */
export class PythPriceService {
    private static instance: PythPriceService | null = null;
    private client: HermesClient;
    private activeSubscriptions: Set<string> = new Set();
    private priceUpdateCallbacks: Set<PriceUpdateCallback> = new Set();
    private connectionStatusCallbacks: Set<ConnectionStatusCallback> =
        new Set();
    private reconnectTimer: NodeJS.Timeout | null = null;
    private monitorTimer: NodeJS.Timeout | null = null;
    private isConnected = false;
    private priceCache: Map<string, PythPriceData> = new Map();
    private latencyStats: Map<string, number[]> = new Map();
    private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {
        this.client = new HermesClient(PYTH_ENDPOINT);
        this.setupEventHandlers();
    }

    /**
     * Get singleton instance of PythPriceService
     */
    public static getInstance(): PythPriceService {
        if (!PythPriceService.instance) {
            PythPriceService.instance = new PythPriceService();
        }
        return PythPriceService.instance;
    }

    /**
     * Setup WebSocket event handlers
     */
    private setupEventHandlers(): void {
        // Start connection monitoring
        this.monitorConnection();
    }

    /**
     * Monitor connection status and attempt reconnection if needed
     */
    private monitorConnection(): void {
        // Set initial connection status to true since HTTP API doesn't need persistent connection
        this.setConnectionStatus(true);

        // Check connection every 5 seconds
        this.monitorTimer = setInterval(async () => {
            try {
                // Try to fetch a price to check if connection is alive
                const testFeedId = PYTH_PRICE_FEEDS.BTC.id;
                const result = await this.client.getLatestPriceUpdates([
                    testFeedId,
                ]);

                if (result && result.parsed && result.parsed.length > 0) {
                    if (!this.isConnected) {
                        this.setConnectionStatus(true);
                        console.log('🟢 Pyth connection established');
                    }
                } else {
                    throw new Error('No data received');
                }
            } catch (error) {
                if (this.isConnected) {
                    this.setConnectionStatus(false);
                    console.error('🔴 Pyth connection lost:', error);
                }
            }
        }, 5000);
    }

    /**
     * Subscribe to price updates for a symbol
     */
    public async subscribeToSymbol(symbol: string): Promise<void> {
        const priceFeedId = getPriceFeedId(symbol);
        if (!priceFeedId) {
            console.warn(`No Pyth price feed found for symbol: ${symbol}`);
            return;
        }

        if (this.activeSubscriptions.has(symbol)) {
            return; // Already subscribed
        }

        this.activeSubscriptions.add(symbol);

        // Test immediate fetch
        this.testFetchPrice(symbol, priceFeedId);

        // Start polling for this symbol
        this.startPollingForSymbol(symbol, priceFeedId);
    }

    /**
     * Test immediate price fetch
     */
    private async testFetchPrice(
        symbol: string,
        priceFeedId: string,
    ): Promise<void> {
        try {
            const result = await this.client.getLatestPriceUpdates([
                priceFeedId,
            ]);

            if (result && result.parsed && result.parsed.length > 0) {
                this.handlePriceUpdate(symbol, result.parsed[0]);
            }
        } catch (error) {
            console.error(`[PythPriceService] Test fetch error:`, error);
        }
    }

    /**
     * Start polling for price updates for a specific symbol
     */
    private startPollingForSymbol(symbol: string, priceFeedId: string): void {
        // Clear any existing interval for this symbol
        const existingInterval = this.pollingIntervals.get(symbol);
        if (existingInterval) {
            clearInterval(existingInterval);
        }

        // Poll every second for real-time updates
        const pollInterval = setInterval(async () => {
            if (!this.activeSubscriptions.has(symbol)) {
                clearInterval(pollInterval);
                this.pollingIntervals.delete(symbol);
                return;
            }

            try {
                const startTime = Date.now();

                // getLatestPriceUpdates returns an object with parsed property
                const result = await this.client.getLatestPriceUpdates([
                    priceFeedId,
                ]);
                const latency = Date.now() - startTime;

                // Track latency stats
                this.updateLatencyStats(symbol, latency);

                if (result && result.parsed && result.parsed.length > 0) {
                    const update = result.parsed[0];
                    this.handlePriceUpdate(symbol, update);
                } else {
                    console.warn(
                        `[PythPriceService] No price updates received for ${symbol}`,
                    );
                }
            } catch (error) {
                console.error(`Error fetching price for ${symbol}:`, error);
            }
        }, 1000);

        // Store the interval
        this.pollingIntervals.set(symbol, pollInterval);
    }

    /**
     * Update latency statistics for monitoring
     */
    private updateLatencyStats(symbol: string, latency: number): void {
        const stats = this.latencyStats.get(symbol) || [];
        stats.push(latency);

        // Keep only last 60 samples (1 minute of data)
        if (stats.length > 60) {
            stats.shift();
        }

        this.latencyStats.set(symbol, stats);

        // Log high latency in development
        if (process.env.NODE_ENV === 'development' && latency > 500) {
            console.warn(`⚠️ [Pyth] High latency for ${symbol}: ${latency}ms`);
        }
    }

    /**
     * Handle incoming price update
     */
    private handlePriceUpdate(symbol: string, update: any): void {
        const priceData = this.parsePriceUpdate(symbol, update);

        // Get previous price before updating cache
        const previousPrice = this.priceCache.get(symbol)?.price;

        // Update cache
        this.priceCache.set(symbol, priceData);

        // Monitor for large price deviations
        if (
            previousPrice &&
            Math.abs((priceData.price - previousPrice) / previousPrice) > 0.05
        ) {
            console.warn(
                `⚠️ [Pyth] Large price movement detected for ${symbol}: ${previousPrice.toFixed(2)} → ${priceData.price.toFixed(2)}`,
            );
        }

        // Notify all callbacks
        this.priceUpdateCallbacks.forEach((callback) => {
            try {
                callback(symbol, priceData);
            } catch (error) {
                console.error('Error in price update callback:', error);
            }
        });
    }

    /**
     * Parse Pyth price update into our format
     */
    private parsePriceUpdate(symbol: string, update: any): PythPriceData {
        // Check if we have the price data structure
        if (!update || !update.price) {
            console.error(
                `[PythPriceService] Invalid price update structure:`,
                update,
            );
            throw new Error('Invalid price update structure');
        }

        // Parse price and confidence - price values are stored as strings with exponent
        const priceValue = parseFloat(update.price.price);
        const exponent = parseInt(update.price.expo);
        const price = priceValue * Math.pow(10, exponent);

        const confidenceValue = parseFloat(update.price.conf);
        const confidence = confidenceValue * Math.pow(10, exponent);

        // Parse publish time - it's in seconds
        const publishTime = parseInt(update.price.publish_time);
        const currentTime = Math.floor(Date.now() / 1000);
        const age = currentTime - publishTime;
        const isStale = age > PRICE_STALENESS_THRESHOLD;

        return {
            price,
            confidence,
            publishTime,
            symbol,
            isStale,
        };
    }

    /**
     * Unsubscribe from price updates for a symbol
     */
    public unsubscribeFromSymbol(symbol: string): void {
        this.activeSubscriptions.delete(symbol);
        this.priceCache.delete(symbol);

        // Clear polling interval
        const interval = this.pollingIntervals.get(symbol);
        if (interval) {
            clearInterval(interval);
            this.pollingIntervals.delete(symbol);
        }
    }

    /**
     * Register a callback for price updates
     */
    public onPriceUpdate(callback: PriceUpdateCallback): () => void {
        this.priceUpdateCallbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.priceUpdateCallbacks.delete(callback);
        };
    }

    /**
     * Register a callback for connection status changes
     */
    public onConnectionStatusChange(
        callback: ConnectionStatusCallback,
    ): () => void {
        this.connectionStatusCallbacks.add(callback);

        // Immediately call with current status
        callback(this.isConnected);

        // Return unsubscribe function
        return () => {
            this.connectionStatusCallbacks.delete(callback);
        };
    }

    /**
     * Get cached price for a symbol
     */
    public getCachedPrice(symbol: string): PythPriceData | undefined {
        return this.priceCache.get(symbol);
    }

    /**
     * Update connection status and notify callbacks
     */
    private setConnectionStatus(connected: boolean): void {
        this.isConnected = connected;
        this.connectionStatusCallbacks.forEach((callback) => {
            try {
                callback(connected);
            } catch (error) {
                console.error('Error in connection status callback:', error);
            }
        });
    }

    /**
     * Get current connection status
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * Get performance metrics for monitoring
     */
    public getPerformanceMetrics(): Map<
        string,
        { avgLatency: number; maxLatency: number }
    > {
        const metrics = new Map<
            string,
            { avgLatency: number; maxLatency: number }
        >();

        this.latencyStats.forEach((stats, symbol) => {
            if (stats.length === 0) return;

            const avgLatency =
                stats.reduce((sum, val) => sum + val, 0) / stats.length;
            const maxLatency = Math.max(...stats);

            metrics.set(symbol, { avgLatency, maxLatency });
        });

        return metrics;
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.monitorTimer) {
            clearInterval(this.monitorTimer);
        }
        this.pollingIntervals.forEach((interval) => clearInterval(interval));
        this.pollingIntervals.clear();
        this.activeSubscriptions.clear();
        this.priceUpdateCallbacks.clear();
        this.connectionStatusCallbacks.clear();
        this.priceCache.clear();
        this.latencyStats.clear();
        PythPriceService.instance = null;
    }
}
