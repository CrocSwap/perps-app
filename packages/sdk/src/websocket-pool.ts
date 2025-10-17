import {
    WebSocketInstance,
    type WebSocketInstanceConfig,
    type SocketType,
    type Callback,
    type ActiveSubscription,
    type ErrCallback,
} from './websocket-instance';
import type { Subscription } from './utils/types';

// Re-export types
export type { SocketType, Callback } from './websocket-instance';
export { WebSocketInstance } from './websocket-instance';

export interface WebSocketEndpoints {
    market?: string;
    user?: string;
    [key: string]: string | undefined; // Allow custom endpoints
}

export interface WebSocketPoolConfig {
    endpoints: WebSocketEndpoints;
    isDebug?: boolean;
    numWorkers?: number;
    pingInterval?: number;
}

// Define channel to socket type mapping
const CHANNEL_TO_SOCKET_TYPE: Record<string, SocketType> = {
    // Market data channels
    l2Book: 'market',
    trades: 'market',
    candle: 'market',
    allMids: 'market',

    // User data channels
    userEvents: 'user',
    userFills: 'user',
    orderUpdates: 'user',
    userFundings: 'user',
    userNonFundingLedgerUpdates: 'user',
    webData2: 'user',
    userHistoricalOrders: 'user',
    userTwapSliceFills: 'user',
    userTwapHistory: 'user',
    notification: 'user',
    error: 'user',
};

export class WebSocketPool {
    private sockets: Map<string, WebSocketInstance> = new Map();
    private config: WebSocketPoolConfig;
    private customChannelMapping: Record<string, string> = {};
    private useMarketOnly: boolean = false;

    constructor(config: WebSocketPoolConfig) {
        this.config = config;
        this.initializeSockets();
    }

    private initializeSockets() {
        const socketsToCreate: Array<[string, WebSocketInstanceConfig]> = [];

        // Prepare market socket config if endpoint provided
        // if (this.config.endpoints.market) {
        //     const marketConfig: WebSocketInstanceConfig = {
        //         baseUrl: this.config.endpoints.market,
        //         socketType: 'market',
        //         socketName: 'market',
        //         isDebug: this.config.isDebug,
        //         numWorkers: this.config.numWorkers,
        //         pingInterval: this.config.pingInterval,
        //         autoConnect: false, // Don't connect immediately
        //     };
        //     socketsToCreate.push(['market', marketConfig]);
        // }

        // Prepare user socket config if endpoint provided
        if (this.config.endpoints.user) {
            const userConfig: WebSocketInstanceConfig = {
                baseUrl: this.config.endpoints.user,
                socketType: 'user',
                socketName: 'user',
                isDebug: this.config.isDebug,
                numWorkers: this.config.numWorkers,
                pingInterval: this.config.pingInterval,
                autoConnect: true, // Don't connect immediately
            };
            socketsToCreate.push(['user', userConfig]);
        }

        // Prepare any custom sockets
        Object.entries(this.config.endpoints).forEach(([name, endpoint]) => {
            if (name !== 'market' && name !== 'user' && endpoint) {
                const customConfig: WebSocketInstanceConfig = {
                    baseUrl: endpoint,
                    socketType: 'custom',
                    socketName: name,
                    isDebug: this.config.isDebug,
                    numWorkers: this.config.numWorkers,
                    pingInterval: this.config.pingInterval,
                    autoConnect: true, // Don't connect immediately
                };
                socketsToCreate.push([name, customConfig]);
            }
        });

        // Create all socket instances first
        socketsToCreate.forEach(([name, config]) => {
            this.sockets.set(name, new WebSocketInstance(config));
        });

        // Connect all sockets in parallel
        this.sockets.forEach((socket) => {
            if (socket.isAutoConnect()) {
                socket.connect();
            }
        });
    }

    /**
     * Get the appropriate socket for a subscription type
     */
    private getSocketForSubscription(
        subscription: Subscription,
    ): WebSocketInstance | undefined {
        if (this.useMarketOnly) {
            return this.sockets.get('market');
        }

        const channelType = subscription.type;

        // Check custom mapping first
        if (this.customChannelMapping[channelType]) {
            return this.sockets.get(this.customChannelMapping[channelType]);
        }

        // Use default mapping
        const socketType = CHANNEL_TO_SOCKET_TYPE[channelType];
        if (socketType) {
            return this.sockets.get(socketType);
        }

        // If no mapping found, default to market socket if available
        return this.sockets.get('market');
    }

    /**
     * Subscribe to a channel, automatically routing to the correct socket
     */
    public subscribe(
        subscription: Subscription,
        callback: Callback,
        errorCallback?: ErrCallback,
    ) {
        const socket = this.getSocketForSubscription(subscription);

        if (!socket) {
            throw new Error(
                `No socket available for subscription type: ${subscription.type}`,
            );
        }

        return socket.subscribe(
            subscription,
            callback,
            undefined,
            errorCallback,
        );
    }

    /**
     * Unsubscribe from a channel
     */
    public unsubscribe(
        subscription: Subscription,
        callback: Callback,
        subscriptionId: number,
    ) {
        const socket = this.getSocketForSubscription(subscription);

        if (!socket) {
            console.warn(
                `No socket found for subscription type: ${subscription.type}`,
            );
            return;
        }

        socket.unsubscribe(subscription, callback, subscriptionId);
    }

    /**
     * Get a specific socket by name
     */
    public getSocket(name: string): WebSocketInstance | undefined {
        return this.sockets.get(name);
    }

    /**
     * Get all sockets
     */
    public getAllSockets(): Map<string, WebSocketInstance> {
        return this.sockets;
    }

    /**
     * Add custom channel to socket mapping
     */
    public setChannelMapping(channelType: string, socketName: string) {
        if (!this.sockets.has(socketName)) {
            throw new Error(`Socket ${socketName} does not exist`);
        }
        this.customChannelMapping[channelType] = socketName;
    }

    /**
     * Reconnect all sockets
     */
    public reconnectAll() {
        this.sockets.forEach((socket) => {
            if (socket.isAutoConnect()) {
                console.log('>>> reconnecting socket', socket.getSocketName());
                socket.reconnect();
            }
        });
    }

    /**
     * Reconnect a specific socket
     */
    public reconnectSocket(name: string) {
        const socket = this.sockets.get(name);
        if (socket) {
            socket.reconnect();
        }
    }

    /**
     * Stop all sockets
     */
    public stopAll() {
        this.sockets.forEach((socket) => socket.stop());
        // [22-07-2025] clear is commented out to make reInit action working
        // this.sockets.clear();
    }

    /**
     * Stop a specific socket
     */
    public stopSocket(name: string) {
        const socket = this.sockets.get(name);
        if (socket) {
            socket.stop();
            this.sockets.delete(name);
        }
    }

    /**
     * Enable sleep mode for all sockets
     */
    public enableSleepMode() {
        this.sockets.forEach((socket) => socket.enableSleepMode());
    }

    /**
     * Disable sleep mode for all sockets
     */
    public disableSleepMode() {
        this.sockets.forEach((socket) => socket.disableSleepMode());
    }

    /**
     * Get connection status for all sockets
     */
    public getConnectionStatus(): Record<string, boolean> {
        const status: Record<string, boolean> = {};
        this.sockets.forEach((socket, name) => {
            status[name] = socket.isConnected();
        });
        return status;
    }

    /**
     * Add a new socket dynamically
     */
    public addSocket(
        name: string,
        endpoint: string,
        socketType: SocketType = 'custom',
    ) {
        if (this.sockets.has(name)) {
            throw new Error(`Socket ${name} already exists`);
        }

        const config: WebSocketInstanceConfig = {
            baseUrl: endpoint,
            socketType,
            socketName: name,
            isDebug: this.config.isDebug,
            numWorkers: this.config.numWorkers,
            pingInterval: this.config.pingInterval,
        };

        this.sockets.set(name, new WebSocketInstance(config));
    }
    // [22-07-2025] for stashing subs in useSdk hook
    public getActiveSubscriptions() {
        const activeSubs: Record<string, ActiveSubscription[]> = {};
        this.sockets.forEach((socket) => {
            const socketActiveSubs = socket.getActiveSubscriptions();
            Object.keys(socketActiveSubs).forEach((key) => {
                activeSubs[key] = socketActiveSubs[key];
            });
        });
        return activeSubs;
    }

    // [22-07-2025] reInit action, passes stashed subs to related socket instance to re-activate sub after new connection
    public reInit(stashedSubs: Record<string, ActiveSubscription[]>) {
        Object.values(stashedSubs).forEach((subs) => {
            subs.forEach((sub) => {
                const socket = this.getSocketForSubscription(sub.subscription);
                if (socket) {
                    socket.addToQueuedSubs(sub);
                }
            });
        });

        setTimeout(() => {
            this.sockets.forEach((socket) => {
                socket.connect();
            }, 200);
        });
    }

    public setUseMarketOnly(useMarketOnly: boolean) {
        this.useMarketOnly = useMarketOnly;
    }

    public hardUnsubscribe(
        subscription: Subscription,
        callback: Callback,
    ): void {
        this.sockets.forEach((socket) => {
            socket.hardUnsubscribe(subscription, callback);
        });
    }
}

/**
 * Backward compatibility wrapper that mimics the old Info interface
 * but uses WebSocketPool under the hood
 */
export class MultiSocketInfo {
    private pool: WebSocketPool;
    private useMarketOnly: boolean = false;

    constructor(
        endpoints: WebSocketEndpoints | string,
        isDebug: boolean = false,
    ) {
        // Support old single endpoint string format
        if (typeof endpoints === 'string') {
            endpoints = {
                market: endpoints,
                user: endpoints,
            };
        }

        this.pool = new WebSocketPool({
            endpoints,
            isDebug,
        });
    }

    public subscribe(
        subscription: Subscription,
        callback: Callback,
        errorCallback?: ErrCallback,
    ) {
        return this.pool.subscribe(subscription, callback, errorCallback);
    }

    public unsubscribe(
        subscription: Subscription,
        callback: Callback,
        subscriptionId: number,
    ) {
        this.pool.unsubscribe(subscription, callback, subscriptionId);
    }

    public reconnect() {
        console.log('>>> reconnect');
        this.pool.reconnectAll();
    }

    public stop() {
        this.pool.stopAll();
    }

    public enableSleepMode() {
        this.pool.enableSleepMode();
    }

    public disableSleepMode() {
        this.pool.disableSleepMode();
    }

    // New methods for multi-socket support
    public getPool(): WebSocketPool {
        return this.pool;
    }

    public getMarketSocket(): WebSocketInstance | undefined {
        return this.pool.getSocket('market');
    }

    public getUserSocket(): WebSocketInstance | undefined {
        return this.pool.getSocket('user');
    }

    // [22-07-2025] returns all active subs for stashing in useSdk hook
    public getActiveSubscriptions() {
        return this.pool.getActiveSubscriptions();
    }

    public setUseMarketOnly(useMarketOnly: boolean) {
        this.useMarketOnly = useMarketOnly;
        this.pool.setUseMarketOnly(useMarketOnly);
    }

    public hardUnsubscribe(
        subscription: Subscription,
        callback: Callback,
    ): void {
        this.pool.hardUnsubscribe(subscription, callback);
    }
}
