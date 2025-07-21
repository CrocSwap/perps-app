import {
    DEFAULT_PING_INTERVAL_MS,
    PONG_CHECK_TIMEOUT_MS,
    RECONNECT_TIMEOUT_MS,
} from './config';
import { createJsonParserWorker } from './utils/workers';
import type { Subscription, WsMsg } from './utils/types';

export type Callback = (msg: WsMsg) => void;
export type SocketType = 'market' | 'user' | 'custom';

export interface ActiveSubscription {
    callback: Callback;
    multiCallbacks?: Callback[];
    subscriptionId: number;
    subscription: Subscription;
}

export interface WebSocketInstanceConfig {
    baseUrl: string;
    socketType: SocketType;
    socketName?: string;
    isDebug?: boolean;
    numWorkers?: number;
    pingInterval?: number;
    autoConnect?: boolean; // defaults to true
}

function subscriptionToIdentifier(subscription: Subscription): string {
    switch (subscription.type) {
        case 'allMids':
            return 'allMids';
        case 'l2Book':
            return `l2Book:${subscription.coin.toLowerCase()}`;
        case 'trades':
            return `trades:${subscription.coin.toLowerCase()}`;
        case 'userEvents':
            return 'userEvents';
        case 'userFills':
            return `userFills:${subscription.user.toLowerCase()}`;
        case 'candle':
            return `candle:${subscription.coin.toLowerCase()},${subscription.interval}`;
        case 'orderUpdates':
            return 'orderUpdates';
        case 'userFundings':
            return `userFundings:${subscription.user.toLowerCase()}`;
        case 'userNonFundingLedgerUpdates':
            return `userNonFundingLedgerUpdates:${subscription.user.toLowerCase()}`;
        case 'webData2':
            return `webData2:${subscription.user.toLowerCase()}`;
        case 'notification':
            return `notification`;
        case 'userHistoricalOrders':
            return `userHistoricalOrders:${subscription.user.toLowerCase()}`;
        case 'userTwapSliceFills':
            return `userTwapSliceFills:${subscription.user.toLowerCase()}`;
        case 'userTwapHistory':
            return `userTwapHistory:${subscription.user.toLowerCase()}`;
        default:
            throw new Error('Unknown subscription type');
    }
}

function wsMsgToIdentifier(wsMsg: WsMsg): string | undefined {
    switch (wsMsg.channel) {
        case 'pong':
            return 'pong';
        case 'allMids':
            return 'allMids';
        case 'l2Book':
            return `l2Book:${wsMsg.data.coin.toLowerCase()}`;
        case 'trades':
            const trades = wsMsg.data;
            if (!Array.isArray(trades) || trades.length === 0) return undefined;
            return `trades:${trades[0].coin.toLowerCase()}`;
        case 'user':
            return 'userEvents';
        case 'userFills':
            return `userFills:${wsMsg.data.user.toLowerCase()}`;
        case 'candle':
            return `candle:${wsMsg.data.s?.toLowerCase?.() ?? wsMsg.data.coin?.toLowerCase?.()},${wsMsg.data.i ?? wsMsg.data.interval}`;
        case 'orderUpdates':
            return 'orderUpdates';
        case 'userFundings':
            return `userFundings:${wsMsg.data.user.toLowerCase()}`;
        case 'userNonFundingLedgerUpdates':
            return `userNonFundingLedgerUpdates:${wsMsg.data.user.toLowerCase()}`;
        case 'webData2':
            return `webData2:${wsMsg.data.user.toLowerCase()}`;
        case 'notification':
            return 'notification';
        case 'userHistoricalOrders':
            return `userHistoricalOrders:${wsMsg.data.user.toLowerCase()}`;
        case 'userTwapSliceFills':
            return `userTwapSliceFills:${wsMsg.data.user.toLowerCase()}`;
        case 'userTwapHistory':
            return `userTwapHistory:${wsMsg.data.user.toLowerCase()}`;
        default:
            return undefined;
    }
}

export class WebSocketInstance {
    private ws!: WebSocket;
    private wsReady: boolean = false;
    private subscriptionIdCounter: number = Math.floor(Math.random() * 10000);
    private queuedSubscriptions: Array<{
        subscription: Subscription;
        active: ActiveSubscription;
    }> = [];
    private activeSubscriptions: Record<string, ActiveSubscription[]> = {};
    private allSubscriptions: Record<
        number,
        { subscription: Subscription; callback: Callback }
    > = {};
    private pingInterval: number | null = null;
    private stopped: boolean = false;
    private isDebug: boolean;
    private baseUrl: string;
    private workers: Worker[] = [];
    private nextWorkerIndex: number = 0;
    private numWorkers: number;
    private jsonParserWorkerBlobUrl: string | null = null;
    private pongReceived: boolean = false;
    private pongTimeout: NodeJS.Timeout | null = null;
    private sleepMode: boolean = false;
    private pongCheckLock: boolean = false;
    private pingIntervalMs: number;
    private firstMessageLogged: boolean = false;
    private isConnecting: boolean = false;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    // New properties for multi-socket support
    private readonly socketType: SocketType;
    private readonly socketName: string;
    private onConnectionChange?: (connected: boolean) => void;

    constructor(config: WebSocketInstanceConfig) {
        this.isDebug = config.isDebug ?? false;
        this.baseUrl = config.baseUrl;
        this.numWorkers = config.numWorkers ?? 4;
        this.socketType = config.socketType;
        this.socketName = config.socketName ?? config.socketType;
        this.pingIntervalMs = config.pingInterval ?? DEFAULT_PING_INTERVAL_MS;

        // Bind methods to ensure proper context
        this.onOpen = this.onOpen.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);

        console.log(
            `[${this.socketName}] WebSocketInstance created with baseUrl:`,
            this.baseUrl,
        );

        this.initializeWorkers();

        // Auto-connect unless explicitly disabled
        if (config.autoConnect !== false) {
            this.connect();
        }
    }

    private initializeWorkers() {
        if (this.numWorkers === 0) {
            this.log(
                'No workers requested, skipping initialization. JSON parsing will occur on the main thread.',
            );
            return;
        }

        this.workers.forEach((worker) => worker.terminate());
        this.workers = [];

        if (this.jsonParserWorkerBlobUrl) {
            URL.revokeObjectURL(this.jsonParserWorkerBlobUrl);
        }
        // Create a unique worker blob URL for each instance
        this.jsonParserWorkerBlobUrl = createJsonParserWorker();

        this.log(`Initializing ${this.numWorkers} JSON parsing worker(s)`);
        for (let i = 0; i < this.numWorkers; i++) {
            try {
                const worker = new Worker(this.jsonParserWorkerBlobUrl);
                worker.onmessage = (event: MessageEvent) =>
                    this.handleWorkerMessage(event, i);
                worker.onerror = (event) => {
                    this.log(`Worker ${i} error: ${event.message}`, event);
                };
                this.workers.push(worker);
            } catch (error) {
                this.log(`Failed to create worker ${i}:`, error);
            }
        }
        if (this.workers.length < this.numWorkers) {
            this.log(
                `Could only initialize ${this.workers.length} workers instead of the requested ${this.numWorkers}.`,
            );
            this.numWorkers = this.workers.length;
        }
        this.nextWorkerIndex = 0;
    }

    public connect = () => {
        // Prevent duplicate connection attempts
        if (this.isConnecting) {
            console.log(
                `[${this.socketName}] Already connecting, skipping duplicate attempt`,
            );
            return;
        }

        // Check if already connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log(
                `[${this.socketName}] Already connected, skipping connection attempt`,
            );
            return;
        }

        this.isConnecting = true;

        const wsUrl =
            'wss' + this.baseUrl.slice(this.baseUrl.indexOf(':')) + '/ws';
        console.log(`[${this.socketName}] Connecting to`, wsUrl);

        // Create WebSocket
        try {
            this.ws = new WebSocket(wsUrl);
            this.wsReady = false;
            this.stopped = false;

            this.ws.addEventListener('open', this.onOpen);
            this.ws.addEventListener('message', this.onMessage);
            this.ws.addEventListener('close', this.onClose);
            this.ws.addEventListener('error', this.onError);
        } catch (error) {
            console.error(
                `[${this.socketName}] Failed to create WebSocket:`,
                error,
            );
            this.isConnecting = false;
            throw error;
        }

        // make sure workers are ready before connecting
        if (this.workers.length === 0 && this.numWorkers > 0) {
            this.log('Workers not initialized, attempting re-initialization.');
            this.initializeWorkers();
            if (this.workers.length === 0) {
                this.log(
                    'Worker re-initialization failed. Proceeding without workers.',
                );
            }
        }
    };

    private log = (...args: any[]) => {
        if (this.isDebug) {
            console.log(`[WebSocket:${this.socketName}]`, ...args);
        }
    };

    private sendPing = () => {
        if (
            this.stopped ||
            !this.ws ||
            this.ws.readyState !== WebSocket.OPEN ||
            this.sleepMode
        )
            return;
        this.log('sending ping');
        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
        }

        this.ws.send(JSON.stringify({ method: 'ping' }));

        this.pongTimeout = setTimeout(() => {
            if (!this.pongReceived && !this.pongCheckLock && !this.sleepMode) {
                console.log(
                    `>>> [${this.socketName}] pong reconnect`,
                    new Date().toISOString(),
                );
                this.reconnect();
            }
        }, PONG_CHECK_TIMEOUT_MS);

        this.pongReceived = false;
    };

    private onOpen = () => {
        console.log(`[${this.socketName}] onOpen`);
        this.wsReady = true;
        this.isConnecting = false;
        this.firstMessageLogged = false;
        this.onConnectionChange?.(true);

        // send queued subs
        for (const { subscription, active } of this.queuedSubscriptions) {
            this.subscribe(
                subscription,
                active.callback,
                active.subscriptionId,
            );
        }
        this.queuedSubscriptions = [];

        if (!this.stopped && this.pingInterval === null) {
            // @ts-ignore
            this.pingInterval = setInterval(this.sendPing, this.pingIntervalMs);
            // send initial ping
            this.sendPing();
        }
    };

    private onMessage = (event: MessageEvent) => {
        if (this.sleepMode) {
            return;
        }
        const message = event.data;

        // Log first message to debug connection issues
        if (!this.firstMessageLogged) {
            this.firstMessageLogged = true;
            console.log(
                `[${this.socketName}] First message received:`,
                message.substring ? message.substring(0, 200) : message,
            );
        }

        // Skip connection established message
        if (message === 'Websocket connection established.') {
            console.log(
                `[${this.socketName}] Websocket connection established.`,
            );
            return;
        }

        // Check for error messages
        if (message.includes && message.includes('error')) {
            console.error(
                `[${this.socketName}] Possible error message:`,
                message,
            );
        }

        if (this.numWorkers > 0 && this.workers.length > 0) {
            const worker = this.workers[this.nextWorkerIndex];
            worker.postMessage(message);
            this.nextWorkerIndex =
                (this.nextWorkerIndex + 1) % this.workers.length;
        } else {
            // Parse on main thread
            try {
                const parsed = JSON.parse(message);
                this.handleParsedMessage(parsed);
            } catch (error) {
                this.log('Failed to parse message on main thread:', error);
            }
        }
    };

    private onClose = (event: CloseEvent) => {
        console.log(
            `[${this.socketName}] onClose - Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`,
        );
        this.wsReady = false;
        this.isConnecting = false;
        this.onConnectionChange?.(false);

        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        // Clear any existing reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (!this.stopped) {
            console.log(
                `>>> [${this.socketName}] close reconnect`,
                new Date().toISOString(),
            );
            this.reconnectTimeout = setTimeout(() => {
                if (!this.stopped) {
                    this.connect(); // Call connect directly instead of reconnect
                }
            }, RECONNECT_TIMEOUT_MS);
        }
    };

    private onError = (event: Event) => {
        const wsEvent = event as ErrorEvent;
        console.error(`[${this.socketName}] WebSocket error:`, {
            message: wsEvent.message,
            filename: wsEvent.filename,
            lineno: wsEvent.lineno,
            colno: wsEvent.colno,
            error: wsEvent.error,
            readyState: this.ws?.readyState,
            url: this.ws?.url,
        });
    };

    private handleWorkerMessage = (
        event: MessageEvent,
        workerIndex: number,
    ) => {
        const { success, data, error, originalMessage } = event.data;
        if (success && data) {
            this.handleParsedMessage(data as WsMsg);
        } else if (error) {
            this.log(
                `Worker ${workerIndex} parse error:`,
                error,
                'Original:',
                originalMessage?.substring(0, 100),
            );
        } else {
            this.log(`Worker ${workerIndex} returned invalid response`);
        }
    };

    private handleParsedMessage = (msg: WsMsg | any) => {
        if (!msg) {
            this.log('Received undefined message');
            return;
        }
        // Handle subscription response which is not in the WsMsg type
        if (msg.channel === 'subscriptionResponse') {
            const subId = msg.data?.id;
            const sub = this.allSubscriptions[subId];
            const success = msg.data?.success;
            if (sub && !success) {
                console.error(
                    `[${this.socketName}] subscription failed`,
                    sub.subscription,
                    msg.data,
                );
            } else if (sub && success) {
                this.log(`subscription successful for id ${subId}`);
            }
            return;
        }
        if (msg.channel === 'pong') {
            this.log('pong received');
            this.pongReceived = true;
            return;
        }
        const identifier = wsMsgToIdentifier(msg);
        if (!identifier) {
            this.log('no identifier for', msg);
            return;
        }
        const activeSubscriptions = this.activeSubscriptions[identifier];
        if (!activeSubscriptions || activeSubscriptions.length === 0) {
            if (identifier !== 'notification') {
                this.log('no subscription for', identifier);
            }
            return;
        }

        for (const activeSub of activeSubscriptions) {
            activeSub.callback(msg);
            if (activeSub.multiCallbacks) {
                for (const callback of activeSub.multiCallbacks) {
                    callback(msg);
                }
            }
        }
    };

    public subscribe = (
        subscription: Subscription,
        callback: Callback,
        existingId?: number,
    ) => {
        const subscriptionId = existingId ?? this.subscriptionIdCounter++;
        this.allSubscriptions[subscriptionId] = { subscription, callback };
        const identifier = subscriptionToIdentifier(subscription);

        if (!this.activeSubscriptions[identifier]) {
            this.activeSubscriptions[identifier] = [];
        }

        const existingActiveSubscriptions =
            this.activeSubscriptions[identifier];
        let activeSubscription: ActiveSubscription | undefined;

        if (existingActiveSubscriptions.length > 0) {
            // special handling for userEvents and orderUpdates
            if (identifier === 'userEvents' || identifier === 'orderUpdates') {
                this.log(
                    `Skipping duplicate subscription for ${identifier}. Only one subscription allowed.`,
                );
                activeSubscription = existingActiveSubscriptions[0];
                if (!activeSubscription.multiCallbacks) {
                    activeSubscription.multiCallbacks = [];
                }
                activeSubscription.multiCallbacks.push(callback);
            } else {
                const activeSubscriptionsToAdd =
                    existingActiveSubscriptions.filter(
                        (sub) =>
                            JSON.stringify(sub.subscription) ===
                            JSON.stringify(subscription),
                    );

                if (activeSubscriptionsToAdd.length > 0) {
                    activeSubscription = activeSubscriptionsToAdd[0];
                    if (!activeSubscription.multiCallbacks) {
                        activeSubscription.multiCallbacks = [];
                    }
                    activeSubscription.multiCallbacks.push(callback);
                }
            }
        }

        if (!activeSubscription) {
            activeSubscription = {
                callback,
                subscriptionId,
                subscription,
            };
            existingActiveSubscriptions.push(activeSubscription);
        }

        if (!this.wsReady) {
            this.log('subscription queued', subscription);
            this.queuedSubscriptions.push({
                subscription,
                active: activeSubscription,
            });
        } else {
            // Check if we already sent this exact subscription
            const isDuplicate = existingActiveSubscriptions.some(
                (sub) =>
                    JSON.stringify(sub.subscription) ===
                    JSON.stringify(subscription),
            );

            if (!isDuplicate || existingActiveSubscriptions.length === 1) {
                console.log(`[${this.socketName}] subscribing`, subscription);
                this.ws.send(
                    JSON.stringify({
                        method: 'subscribe',
                        subscription,
                    }),
                );
            } else {
                this.log(
                    `Already subscribed to ${identifier}, skipping duplicate subscription`,
                );
            }
        }

        const unsubscribe = () => {
            this.unsubscribe(subscription, callback, subscriptionId);
        };

        return { unsubscribe };
    };

    public unsubscribe = (
        subscription: Subscription,
        callback: Callback,
        subscriptionId: number,
    ) => {
        delete this.allSubscriptions[subscriptionId];
        const identifier = subscriptionToIdentifier(subscription);
        const activeSubscriptions = this.activeSubscriptions[identifier];
        if (!activeSubscriptions) {
            return;
        }

        const activeSubscriptionIndex = activeSubscriptions.findIndex(
            (sub) => sub.subscriptionId === subscriptionId,
        );

        if (activeSubscriptionIndex !== -1) {
            const activeSub = activeSubscriptions[activeSubscriptionIndex];

            if (activeSub.callback === callback) {
                activeSubscriptions.splice(activeSubscriptionIndex, 1);

                if (activeSubscriptions.length === 0) {
                    delete this.activeSubscriptions[identifier];

                    if (this.wsReady) {
                        this.log('unsubscribing', subscription);
                        this.ws.send(
                            JSON.stringify({
                                method: 'unsubscribe',
                                subscription,
                            }),
                        );
                    }
                }
            } else if (activeSub.multiCallbacks) {
                const callbackIndex =
                    activeSub.multiCallbacks.indexOf(callback);
                if (callbackIndex !== -1) {
                    activeSub.multiCallbacks.splice(callbackIndex, 1);
                    if (activeSub.multiCallbacks.length === 0) {
                        delete activeSub.multiCallbacks;
                    }
                }
            }
        }

        const queuedIndex = this.queuedSubscriptions.findIndex(
            (q) => q.active.subscriptionId === subscriptionId,
        );
        if (queuedIndex !== -1) {
            this.queuedSubscriptions.splice(queuedIndex, 1);
        }
    };

    public reconnect = () => {
        this.log('reconnect');

        // Clear any pending reconnect timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        // Close existing connection if any
        if (
            this.ws &&
            (this.ws.readyState === WebSocket.OPEN ||
                this.ws.readyState === WebSocket.CONNECTING)
        ) {
            this.ws.close();
            // The onClose handler will trigger the reconnection
        } else {
            // No active connection, connect directly
            this.connect();
        }
    };

    public stop = () => {
        this.stopped = true;
        if (this.ws) {
            this.ws.close();
        }
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.workers.forEach((worker) => worker.terminate());
        this.workers = [];
        if (this.jsonParserWorkerBlobUrl) {
            URL.revokeObjectURL(this.jsonParserWorkerBlobUrl);
            this.jsonParserWorkerBlobUrl = null;
        }
    };

    public enableSleepMode = () => {
        this.log('Enabling sleep mode');
        this.sleepMode = true;
        this.pongCheckLock = true;

        if (this.pongTimeout) {
            clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
        }
    };

    public disableSleepMode = () => {
        this.log('Disabling sleep mode');
        this.sleepMode = false;
        this.pongCheckLock = false;
    };

    public getSocketType(): SocketType {
        return this.socketType;
    }

    public getSocketName(): string {
        return this.socketName;
    }

    public isConnected(): boolean {
        return this.wsReady;
    }

    public setConnectionChangeHandler(handler: (connected: boolean) => void) {
        this.onConnectionChange = handler;
    }
}
