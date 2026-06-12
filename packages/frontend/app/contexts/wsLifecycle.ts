export enum WebSocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

export interface WsSubscriptionConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (payload: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    single?: boolean;
}

export interface WsLike {
    readyState: number;
    onopen: ((event?: unknown) => void) | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onmessage: ((event: { data?: any }) => void) | null;
    onclose: ((event?: unknown) => void) | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onerror: ((error: any) => void) | null;
    send: (message: string) => void;
    close: () => void;
}

export interface WsLifecycleOptions {
    url: string;
    createSocket: (url: string) => WsLike;
    getIsClient: () => boolean;
    getSleepMode: () => boolean;
    getInternetConnected: () => boolean;
    getIsTabActive: () => boolean;
    setWsReconnecting: (value: boolean) => void;
    setReadyState?: (state: number) => void;
    setTimeoutFn?: typeof setTimeout;
    clearTimeoutFn?: typeof clearTimeout;
}

export class WsLifecycleController {
    private socket: WsLike | null = null;
    private subscriptions = new Map<string, WsSubscriptionConfig[]>();
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private reconnectAttempts = 0;
    private shouldReconnect = false;
    private shouldReconnectForTabActive = false;
    private readonly setTimeoutFn: typeof setTimeout;
    private readonly clearTimeoutFn: typeof clearTimeout;

    constructor(private readonly options: WsLifecycleOptions) {
        this.setTimeoutFn = options.setTimeoutFn ?? setTimeout;
        this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
    }

    connect() {
        if (!this.options.getIsClient()) return;

        this.clearReconnectTimeout();

        const previousSocket = this.socket;
        if (
            previousSocket &&
            previousSocket.readyState !== WebSocketReadyState.CLOSED
        ) {
            this.socket = null;
            previousSocket.close();
        }

        const socket = this.options.createSocket(this.options.url);
        this.socket = socket;
        this.options.setReadyState?.(WebSocketReadyState.CONNECTING);

        socket.onopen = () => {
            if (this.socket !== socket) return;

            this.options.setReadyState?.(WebSocketReadyState.OPEN);
            this.options.setWsReconnecting(false);
            this.reconnectAttempts = 0;
            this.clearReconnectTimeout();
            this.resubscribeAll();
        };

        socket.onmessage = (event) => {
            if (this.options.getSleepMode() || !event.data) return;

            const msg = JSON.parse(String(event.data)) as {
                channel?: string;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data?: any;
            };
            if (!msg.channel || !this.subscriptions.has(msg.channel)) return;

            this.subscriptions
                .get(msg.channel)
                ?.forEach((config) => config.handler(msg.data));
        };

        socket.onclose = () => {
            if (this.socket !== socket) return;

            this.options.setReadyState?.(WebSocketReadyState.CLOSED);
            this.scheduleReconnect();
        };

        socket.onerror = (_error) => {
            if (this.socket !== socket) return;
            socket.close();
        };
    }

    scheduleReconnect() {
        if (!this.options.getIsClient()) return;

        if (!this.options.getInternetConnected()) {
            this.shouldReconnect = true;
            return;
        }

        if (!this.options.getIsTabActive() || this.options.getSleepMode()) {
            this.shouldReconnectForTabActive = true;
            return;
        }

        const state = this.socket?.readyState;
        if (
            state === WebSocketReadyState.OPEN ||
            state === WebSocketReadyState.CONNECTING
        ) {
            return;
        }

        if (this.reconnectTimeout) return;

        this.options.setWsReconnecting(true);
        const delay = Math.min(
            1000 * Math.pow(2, this.reconnectAttempts),
            10000,
        );
        this.reconnectTimeout = this.setTimeoutFn(() => {
            this.reconnectTimeout = null;
            this.reconnectAttempts += 1;
            this.connect();
        }, delay);
    }

    subscribe(key: string, config: WsSubscriptionConfig) {
        if (!this.subscriptions.has(key)) {
            this.subscriptions.set(key, []);
        }

        if (config.single) {
            const currentSubs = this.subscriptions.get(key) || [];
            currentSubs.forEach((sub) => {
                this.registerWsSubscription(key, sub.payload || {}, true);
            });
            this.subscriptions.set(key, [config]);
        } else {
            this.subscriptions.get(key)!.push(config);
        }

        this.registerWsSubscription(key, config.payload || {});

        if (this.socket?.readyState !== WebSocketReadyState.OPEN) {
            this.scheduleReconnect();
        }
    }

    unsubscribe(key: string, config: WsSubscriptionConfig) {
        if (!this.subscriptions.has(key)) return;

        const configs = this.subscriptions
            .get(key)!
            .filter((c) => c !== config);
        if (configs.length === 0) {
            this.subscriptions.delete(key);
        } else {
            this.subscriptions.set(key, configs);
        }

        this.registerWsSubscription(key, config.payload || {}, true);
    }

    unsubscribeAllByChannel(channel: string) {
        if (this.subscriptions.has(channel)) {
            this.subscriptions.get(channel)!.forEach((config) => {
                this.registerWsSubscription(
                    channel,
                    config.payload || {},
                    true,
                );
            });
        }
        this.subscriptions.delete(channel);
    }

    forceReconnect() {
        if (this.options.getSleepMode()) return;
        this.connect();
    }

    handleInternetConnectedChange(internetConnected: boolean) {
        if (!internetConnected) {
            if (this.socket?.readyState === WebSocketReadyState.OPEN) {
                this.socket.close();
                this.shouldReconnect = true;
            }
            return;
        }

        if (this.shouldReconnect) {
            this.connect();
            this.shouldReconnect = false;
        }
    }

    handleTabActiveChange(isTabActive: boolean) {
        if (isTabActive) {
            if (
                this.socket?.readyState !== WebSocketReadyState.OPEN &&
                this.shouldReconnectForTabActive
            ) {
                this.options.setWsReconnecting(true);
                this.connect();
            }
            this.shouldReconnectForTabActive = false;
            return;
        }

        this.shouldReconnectForTabActive = true;
    }

    cleanup() {
        this.clearReconnectTimeout();
        const socket = this.socket;
        this.socket = null;
        socket?.close();
    }

    getSocketForTest() {
        return this.socket;
    }

    private sendMessage(msg: string) {
        if (this.socket?.readyState === WebSocketReadyState.OPEN) {
            this.socket.send(msg);
        }
    }

    private registerWsSubscription(
        type: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: any,
        unsubscribe: boolean = false,
    ) {
        this.sendMessage(
            JSON.stringify({
                method: unsubscribe ? 'unsubscribe' : 'subscribe',
                subscription: {
                    type,
                    ...payload,
                },
            }),
        );
    }

    private resubscribeAll() {
        this.subscriptions.forEach((configs, key) => {
            configs.forEach((config) => {
                this.registerWsSubscription(key, config.payload || {});
            });
        });
    }

    private clearReconnectTimeout() {
        if (this.reconnectTimeout) {
            this.clearTimeoutFn(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}
