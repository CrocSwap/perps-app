import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useIsClient } from '~/hooks/useIsClient';
import { useDebugStore } from '~/stores/DebugStore';
import { useWorker, WORKERS } from '~/hooks/useWorker';
import { useAppStateStore } from '~/stores/AppStateStore';

// Alternate endpoint (ember2)
const EMBER2_WS_URL = 'wss://ember-leaderboard-v2.liquidity.tools/ws';

// Channel types that should use the ember2 endpoint
const EMBER2_CHANNELS = new Set(['liquidationLevels', 'liquidations']);

interface WsContextType {
    subscribe: (key: string, config: WsSubscriptionConfig) => void;
    unsubscribe: (key: string, config: WsSubscriptionConfig) => void;
    unsubscribeAllByChannel: (channel: string) => void;
    forceReconnect: () => void;
}

enum WebSocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

export const WsContext = createContext<WsContextType>({
    subscribe: () => {},
    unsubscribe: () => {},
    unsubscribeAllByChannel: () => {},
    forceReconnect: () => {},
});

export interface WsProviderProps {
    children: React.ReactNode;
    url: string;
}

export interface WsSubscriptionConfig {
    handler: (payload: any) => void;
    payload?: any;
    single?: boolean;
}

export const WsProvider: React.FC<WsProviderProps> = ({ children, url }) => {
    //----------------------------------- ws context

    const isClient = useIsClient();
    const [readyState, setReadyState] = useState<number>(
        WebSocketReadyState.CLOSED,
    );
    const readyStateRef = useRef<number>(WebSocketReadyState.CLOSED);
    readyStateRef.current = readyState;
    const workers = useRef<Map<string, Worker>>(new Map());
    const socketRef = useRef<WebSocket | null>(null);
    const subscriptions = useRef<Map<string, WsSubscriptionConfig[]>>(
        new Map(),
    );
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const reconnectAttemptsRef = useRef(0);
    const connectWebSocketRef = useRef<() => void>(() => {});
    const scheduleReconnectRef = useRef<(reason?: string) => void>(() => {});

    // Secondary socket for ember2 endpoint
    const ember2SocketRef = useRef<WebSocket | null>(null);
    const ember2Subscriptions = useRef<Map<string, WsSubscriptionConfig[]>>(
        new Map(),
    );
    const [ember2ReadyState, setEmber2ReadyState] = useState<number>(
        WebSocketReadyState.CLOSED,
    );

    const { isWsSleepMode } = useDebugStore();
    const { isTabActive, setWsReconnecting } = useAppStateStore();
    const sleepModeRef = useRef(isWsSleepMode);
    sleepModeRef.current = isWsSleepMode;

    const { internetConnected } = useAppStateStore();
    const internetConnectedRef = useRef(internetConnected);
    internetConnectedRef.current = internetConnected;
    const isTabActiveRef = useRef(isTabActive);
    isTabActiveRef.current = isTabActive;

    const shouldReconnect = useRef(false);
    const shouldReconnectForTabActive = useRef(false);

    function extractChannelFromPayload(raw: string): string {
        const match = raw.match(/"channel"\s*:\s*"([^"]+)"/);
        return match ? match[1] : '';
    }

    const connectWebSocket = useCallback(() => {
        if (!isClient) {
            return;
        } // ✅ Ensure WebSocket only runs on client side

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Close the previous WebSocket if it exists
        if (
            socketRef.current &&
            socketRef.current.readyState !== WebSocketReadyState.CLOSED
        ) {
            socketRef.current.close();
        }

        // Create a new WebSocket connection
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
            setReadyState(WebSocketReadyState.OPEN);
            setWsReconnecting(false);
            reconnectAttemptsRef.current = 0;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            if (sleepModeRef.current) {
                return;
            }

            if (event.data) {
                const channel = extractChannelFromPayload(event.data);
                // const worker = getWorker(channel);
                // if (worker) {
                //     worker.postMessage(event.data);
                // }

                // const sub = subscriptions.current.get(channel);
                // if(sub){
                //   subscriptions.current.get(channel)?.forEach(config => {
                //     config.handler(event.data);
                //   });
                // }

                const msg = JSON.parse(event.data);

                if (subscriptions.current.has(msg.channel)) {
                    subscriptions.current
                        .get(msg.channel)
                        ?.forEach((config) => {
                            config.handler(msg.data);
                        });
                }
            }
        };

        socket.onclose = () => {
            if (socketRef.current !== socket) {
                return;
            }
            setReadyState(WebSocketReadyState.CLOSED);
            scheduleReconnectRef.current('close');
        };

        socket.onerror = (error) => {
            if (socketRef.current !== socket) {
                return;
            }
            socket.close();
        };
    }, [isClient, setWsReconnecting, url]);

    const scheduleReconnect = useCallback(
        (reason?: string) => {
            if (!isClient) return;

            if (!internetConnectedRef.current) {
                shouldReconnect.current = true;
                return;
            }

            if (!isTabActiveRef.current || sleepModeRef.current) {
                shouldReconnectForTabActive.current = true;
                return;
            }

            const state = socketRef.current?.readyState;
            if (
                state === WebSocketReadyState.OPEN ||
                state === WebSocketReadyState.CONNECTING
            ) {
                return;
            }

            if (reconnectTimeoutRef.current) {
                return;
            }

            setWsReconnecting(true);
            const delay = Math.min(
                1000 * Math.pow(2, reconnectAttemptsRef.current),
                10000,
            );
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                reconnectAttemptsRef.current += 1;
                connectWebSocketRef.current();
            }, delay);
        },
        [isClient, setWsReconnecting],
    );

    useEffect(() => {
        connectWebSocketRef.current = connectWebSocket;
    }, [connectWebSocket]);

    useEffect(() => {
        scheduleReconnectRef.current = scheduleReconnect;
    }, [scheduleReconnect]);

    // Connect to ember2 WebSocket (lazy - only when needed)
    const connectEmber2WebSocket = useCallback(() => {
        if (!isClient) {
            return;
        }

        // Don't reconnect if already open or connecting
        if (
            ember2SocketRef.current?.readyState === WebSocketReadyState.OPEN ||
            ember2SocketRef.current?.readyState ===
                WebSocketReadyState.CONNECTING
        ) {
            return;
        }

        const socket = new WebSocket(EMBER2_WS_URL);
        ember2SocketRef.current = socket;

        socket.onopen = () => {
            setEmber2ReadyState(WebSocketReadyState.OPEN);
            // Re-subscribe to all ember2 subscriptions
            ember2Subscriptions.current.forEach((configs, key) => {
                configs.forEach((config) => {
                    registerEmber2Subscription(key, config.payload || {});
                });
            });
        };

        socket.onmessage = (event) => {
            if (sleepModeRef.current) {
                return;
            }

            if (event.data) {
                try {
                    const msg = JSON.parse(event.data);
                    const channel = msg.channel || msg.type;

                    if (ember2Subscriptions.current.has(channel)) {
                        ember2Subscriptions.current
                            .get(channel)
                            ?.forEach((config) => {
                                config.handler(msg.data ?? msg);
                            });
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        };

        socket.onclose = () => {
            setEmber2ReadyState(WebSocketReadyState.CLOSED);
        };

        socket.onerror = () => {
            socket.close();
        };
    }, [isClient]);

    useEffect(() => {
        if (isClient) {
            connectWebSocket();
        }

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            // console.log('>>>> socket closed!!!!!!!!!!!!!');
            // socketRef.current?.close();
        };
    }, [url, isClient]); // ✅ Only runs when client-side is ready

    const sendMessage = (msg: string) => {
        if (socketRef.current?.readyState === WebSocketReadyState.OPEN) {
            socketRef.current.send(msg);
        }
    };

    const registerWsSubscription = (
        type: string,
        payload: any,
        unsubscribe: boolean = false,
    ) => {
        sendMessage(
            JSON.stringify({
                method: unsubscribe ? 'unsubscribe' : 'subscribe',
                subscription: {
                    type: type,
                    ...payload,
                },
            }),
        );
    };

    // Send subscription message to ember2 WebSocket
    const sendEmber2Message = (msg: string) => {
        if (ember2SocketRef.current?.readyState === WebSocketReadyState.OPEN) {
            ember2SocketRef.current.send(msg);
        }
    };

    const registerEmber2Subscription = (
        type: string,
        payload: any,
        unsubscribe: boolean = false,
    ) => {
        sendEmber2Message(
            JSON.stringify({
                type: unsubscribe ? 'unsubscribe' : 'subscribe',
                subscription: {
                    type: type,
                    ...payload,
                },
            }),
        );
    };

    useEffect(() => {
        if (readyStateRef.current === WebSocketReadyState.OPEN) {
            subscriptions.current.forEach((configs, key) => {
                configs.forEach((config) => {
                    registerWsSubscription(key, config.payload || {});
                });
            });
        }
    }, [readyState]);

    useEffect(() => {
        if (!internetConnected) {
            if (socketRef.current?.readyState === WebSocketReadyState.OPEN) {
                socketRef.current?.close();
                shouldReconnect.current = true;
            }
            // Also close ember2 socket
            if (
                ember2SocketRef.current?.readyState === WebSocketReadyState.OPEN
            ) {
                ember2SocketRef.current?.close();
            }
        } else {
            if (shouldReconnect.current) {
                connectWebSocket();
                shouldReconnect.current = false;
            }
            // Reconnect ember2 socket if there are active subscriptions
            if (
                ember2Subscriptions.current.size > 0 &&
                ember2SocketRef.current?.readyState !== WebSocketReadyState.OPEN
            ) {
                connectEmber2WebSocket();
            }
        }
    }, [internetConnected, connectEmber2WebSocket]);

    useEffect(() => {
        if (isTabActive) {
            if (
                socketRef.current?.readyState !== WebSocketReadyState.OPEN &&
                shouldReconnectForTabActive.current
            ) {
                setWsReconnecting(true);
                connectWebSocket();
            }
            // Reconnect ember2 socket if needed
            if (
                ember2Subscriptions.current.size > 0 &&
                ember2SocketRef.current?.readyState !==
                    WebSocketReadyState.OPEN &&
                shouldReconnectForTabActive.current
            ) {
                connectEmber2WebSocket();
            }
            shouldReconnectForTabActive.current = false;
        } else {
            shouldReconnectForTabActive.current = true;
        }
    }, [isTabActive, connectEmber2WebSocket]);

    const subscribe = useCallback(
        (key: string, config: WsSubscriptionConfig) => {
            // Check if this channel should use the ember2 endpoint
            if (EMBER2_CHANNELS.has(key)) {
                // Ensure ember2 socket is connected
                connectEmber2WebSocket();

                if (!ember2Subscriptions.current.has(key)) {
                    ember2Subscriptions.current.set(key, []);
                }

                if (config.single) {
                    const currentSubs =
                        ember2Subscriptions.current.get(key) || [];
                    currentSubs.forEach((sub) => {
                        registerEmber2Subscription(
                            key,
                            sub.payload || {},
                            true,
                        );
                    });
                    ember2Subscriptions.current.set(key, [config]);
                } else {
                    ember2Subscriptions.current.get(key)!.push(config);
                }

                // Send subscription if socket is already open
                if (
                    ember2SocketRef.current?.readyState ===
                    WebSocketReadyState.OPEN
                ) {
                    registerEmber2Subscription(key, config.payload || {});
                }
                return;
            }

            // Default: use main WebSocket
            if (!subscriptions.current.has(key)) {
                subscriptions.current.set(key, []);
            }

            if (config.single) {
                const currentSubs = subscriptions.current.get(key) || [];
                currentSubs.forEach((sub) => {
                    registerWsSubscription(key, sub.payload || {}, true);
                });
                subscriptions.current.set(key, [config]);
            } else {
                subscriptions.current.get(key)!.push(config);
            }

            // add subscription through websocket context
            registerWsSubscription(key, config.payload || {});

            if (socketRef.current?.readyState !== WebSocketReadyState.OPEN) {
                scheduleReconnectRef.current('subscribe');
            }
        },
        [connectEmber2WebSocket],
    );

    // unsubscribe all subscriptions by channel
    const unsubscribeAllByChannel = useCallback((channel: string) => {
        // Check if this is an ember2 channel
        if (EMBER2_CHANNELS.has(channel)) {
            if (ember2Subscriptions.current.has(channel)) {
                ember2Subscriptions.current.get(channel)!.forEach((config) => {
                    registerEmber2Subscription(
                        channel,
                        config.payload || {},
                        true,
                    );
                });
            }
            ember2Subscriptions.current.delete(channel);
            return;
        }

        // Default: main WebSocket
        if (subscriptions.current.has(channel)) {
            subscriptions.current.get(channel)!.forEach((config) => {
                registerWsSubscription(channel, config.payload || {}, true);
            });
        }
        subscriptions.current.delete(channel);
    }, []);

    const unsubscribe = useCallback(
        (key: string, config: WsSubscriptionConfig) => {
            // Check if this is an ember2 channel
            if (EMBER2_CHANNELS.has(key)) {
                if (ember2Subscriptions.current.has(key)) {
                    const configs = ember2Subscriptions.current
                        .get(key)!
                        .filter((c) => c !== config);
                    if (configs.length === 0) {
                        ember2Subscriptions.current.delete(key);
                    } else {
                        ember2Subscriptions.current.set(key, configs);
                    }
                    // Send unsubscribe message to ember2 server
                    registerEmber2Subscription(key, config.payload || {}, true);
                }
                return;
            }

            // Default: main WebSocket
            if (subscriptions.current.has(key)) {
                const configs = subscriptions.current
                    .get(key)!
                    .filter((c) => c !== config);
                if (configs.length === 0) {
                    subscriptions.current.delete(key);
                } else {
                    subscriptions.current.set(key, configs);
                }
                // Send unsubscribe message to server
                registerWsSubscription(key, config.payload || {}, true);
            }
        },
        [],
    );

    // const initWorker = (type: string) => {
    //     if (!isClient || workers.current.has(type)) {
    //         return;
    //     }

    //     switch (type) {
    //         // case WsChannels.WEB_DATA2:
    //         //     // const w1 = new Worker(
    //         //     //     new URL(
    //         //     //         './../hooks/workers/webdata2.worker.ts',
    //         //     //         import.meta.url,
    //         //     //     ),
    //         //     //     { type: 'module' },
    //         //     // );

    //         //     const w1 = new webData2Worker();

    //         //     w1.onmessage = (event) => {
    //         //         const subs = subscriptions.current.get(event.data.channel);
    //         //         if (subs) {
    //         //             subs.forEach((config) => {
    //         //                 config.handler(event.data);
    //         //             });
    //         //         }
    //         //     };
    //         //     workers.current.set(type, w1);
    //         //     return w1;
    //         default:
    //             console.log('>>>>>> default worker');
    //             // const w2 = new defaultWorker();

    //             const w2 = new Worker(
    //                 new URL(
    //                     '~/processors/workers/default.worker.ts',
    //                     import.meta.url,
    //                 ),
    //                 // { type: 'module' },
    //             );

    //             // const w2 = new jsonParserWorker();

    //             w2.onmessage = (event) => {
    //                 const subs = subscriptions.current.get(event.data.channel);
    //                 if (subs) {
    //                     subs.forEach((config) => {
    //                         config.handler(event.data.data);
    //                     });
    //                 }
    //             };

    //             workers.current.set(type, w2);
    //             return w2;
    //     }
    // };

    const getWorker = (type: string) => {
        return workers.current.get(type);
    };

    const forceReconnect = useCallback(() => {
        if (sleepModeRef.current) {
            return;
        }
        connectWebSocket();
        // Also reconnect ember2 socket if there are active subscriptions
        if (ember2Subscriptions.current.size > 0) {
            ember2SocketRef.current?.close();
            ember2SocketRef.current = null;
            connectEmber2WebSocket();
        }
    }, [connectEmber2WebSocket]);

    const contextValue = useMemo(
        () => ({
            subscribe,
            unsubscribe,
            unsubscribeAllByChannel,
            forceReconnect,
        }),
        [subscribe, unsubscribe, unsubscribeAllByChannel, forceReconnect],
    );

    return (
        <WsContext.Provider value={contextValue}>{children}</WsContext.Provider>
    );
};

export const useWs = () => useContext(WsContext);
