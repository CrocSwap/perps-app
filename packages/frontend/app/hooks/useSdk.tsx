import {
    API_URLS,
    DEMO_USER,
    Exchange,
    Info,
    type ActiveSubscription,
    type Environment,
} from '@perps-app/sdk';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useDebugStore } from '~/stores/DebugStore';
import {
    SHOULD_LOG_ANALYTICS,
    WS_SLEEP_MODE_STASH_CONNECTION,
} from '~/utils/Constants';
import { useIsClient } from './useIsClient';

type SdkContextType = {
    info: Info | null;
    exchange: Exchange | null;
    lastSleepMs: number;
    lastAwakeMs: number;
};

const SdkContext = createContext<SdkContextType | undefined>(undefined);

export const SdkProvider: React.FC<{
    environment: Environment;
    children: React.ReactNode;
    marketEndpoint?: string;
    userEndpoint?: string;
}> = ({ environment, children, marketEndpoint, userEndpoint }) => {
    const isClient = useIsClient();

    const [info, setInfo] = useState<Info | null>(null);
    const [exchange, setExchange] = useState<Exchange | null>(null);
    const [shouldReconnect, setShouldReconnect] = useState(false);
    const stashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [lastSleepMs, setLastSleepMs] = useState<number>(0);
    const [lastAwakeMs, setLastAwakeMs] = useState<number>(0);

    const stashedSubs = useRef<Record<string, ActiveSubscription[]>>({});

    const {
        internetConnected,
        setWsReconnecting,
        isWsStashed,
        setIsWsStashed,
        isTabActiveDelayed,
    } = useAppStateStore();
    const { isWsSleepMode, isDebugWalletActive } = useDebugStore();

    useEffect(() => {
        if (!isClient) return;
        if (!info) {
            const newInfo = new Info({
                environment,
                skipWs: false,
                useMultiSocket: true, // Re-enable multi-socket mode
                wsEndpoints:
                    marketEndpoint || userEndpoint
                        ? {
                              market: marketEndpoint || API_URLS[environment],
                              user: userEndpoint || API_URLS[environment],
                          }
                        : undefined,
                // isDebug: true, // TODO: remove in prod
            });

            setInfo(newInfo);
            stashedSubs.current = {};

            // Debug: Log WebSocket connections to console
            (window as any).__perps_websockets__ = newInfo;
        } else {
            info.setEnvironment(environment);
        }
        if (!exchange) {
            setExchange(
                new Exchange(
                    {},
                    {
                        environment,
                        accountAddress: DEMO_USER,
                        // isDebug: true, // TODO: remove in prod
                    },
                ),
            );
        } else {
            exchange.setEnvironment(environment);
        }
    }, [isClient, environment, marketEndpoint, userEndpoint]);

    useEffect(() => {
        if (SHOULD_LOG_ANALYTICS) return;
        console.log('>>> useSdk | marketEndpoint', marketEndpoint);
        console.log('>>> useSdk | userEndpoint', userEndpoint);
    }, [marketEndpoint, userEndpoint]);

    useEffect(() => {
        if (!internetConnected) {
            stashSubscriptions();
            stashWebsocket();
            setShouldReconnect(true);
        }
    }, [internetConnected]);

    const stashSubscriptions = useCallback(() => {
        if (info?.multiSocketInfo) {
            const activeSubs =
                info?.multiSocketInfo?.getActiveSubscriptions() || {};

            if (Object.keys(activeSubs).length !== 0) {
                // reset stashed subs if we can access active subs from ws object
                stashedSubs.current = {};
            }
            Object.keys(activeSubs).forEach((key) => {
                const subs = activeSubs[key];
                stashedSubs.current[key] = subs;
            });
        } else {
            const activeSubs = info?.wsManager?.getActiveSubscriptions() || {};

            if (Object.keys(activeSubs).length !== 0) {
                // reset stashed subs if we can access active subs from ws object
                stashedSubs.current = {};
            }

            Object.keys(activeSubs).forEach((key) => {
                const subs = activeSubs[key];
                stashedSubs.current[key] = subs;
            });
        }
        console.log(
            '>>> stashed subscriptions (market only)',
            stashedSubs.current,
            new Date().toISOString(),
        );
    }, [info]);

    const stashWebsocket = useCallback(() => {
        if (info?.multiSocketInfo) {
            info.multiSocketInfo.stop();
        } else {
            info?.wsManager?.stop();
        }
    }, [info]);

    const reInitWs = useCallback(() => {
        if (!isClient) return;

        if (info?.multiSocketInfo) {
            // re-init subs
            info.multiSocketInfo?.getPool().reInit(stashedSubs.current);
        } else {
            info?.wsManager?.reInit(stashedSubs.current);
        }
    }, [isClient, info]);

    useEffect(() => {
        if (info) {
            info.setUseMarketOnly(isDebugWalletActive);
        }
    }, [isDebugWalletActive]);

    useEffect(() => {
        if (!isClient) return;
        if (!isTabActiveDelayed) return;

        if (internetConnected && shouldReconnect) {
            // Check if already connected before reconnecting
            let needsReconnect = true;
            if (info?.multiSocketInfo) {
                const pool = info.multiSocketInfo.getPool();
                const status = pool.getConnectionStatus();
                needsReconnect = !Object.values(status).some(
                    (connected) => connected,
                );
            } else if (info?.wsManager) {
                needsReconnect = !info.wsManager.isWsReady();
            }

            if (needsReconnect) {
                console.log(
                    '>>> alternate reconnect',
                    new Date().toISOString(),
                );
                console.log(
                    '>>> stashed subs',
                    stashedSubs.current,
                    new Date().toISOString(),
                );
                if (info?.multiSocketInfo) {
                    info.multiSocketInfo.reconnect();
                } else {
                    info?.wsManager?.reconnect(stashedSubs.current);
                }
                setWsReconnecting(true);
            }
            setShouldReconnect(false);
        }

        const reconnectInterval = setInterval(() => {
            // Check connection status based on mode
            let isReady = false;
            if (info) {
                if (info.multiSocketInfo) {
                    // Multi-socket mode - check if any socket is connected
                    const pool = info.multiSocketInfo.getPool();
                    const status = pool.getConnectionStatus();
                    isReady = Object.values(status).some(
                        (connected) => connected,
                    );
                } else if (info.wsManager) {
                    // Single socket mode
                    isReady = info.wsManager.isWsReady();
                }
            }

            if (isReady) {
                setWsReconnecting(false);
                clearInterval(reconnectInterval);
            }
        }, 200);

        return () => {
            clearInterval(reconnectInterval);
        };
    }, [
        internetConnected,
        isClient,
        info,
        shouldReconnect,
        isTabActiveDelayed,
        // isWsStashed,
        // isTabActiveDelayed,
    ]);

    useEffect(() => {
        if (!isClient) return;

        if (isWsStashed && isTabActiveDelayed) {
            console.log('>>> will re init ws object', new Date().toISOString());
            reInitWs();
            setWsReconnecting(true);
        }

        const reconnectInterval = setInterval(() => {
            // Check connection status based on mode
            let isReady = false;
            if (info) {
                if (info.multiSocketInfo) {
                    // Multi-socket mode - check if any socket is connected
                    const pool = info.multiSocketInfo.getPool();
                    const status = pool.getConnectionStatus();
                    isReady = Object.values(status).some(
                        (connected) => connected,
                    );
                } else if (info.wsManager) {
                    // Single socket mode
                    isReady = info.wsManager.isWsReady();
                }
            }

            if (isReady) {
                setWsReconnecting(false);
                clearInterval(reconnectInterval);
            }
        }, 200);

        return () => {
            clearInterval(reconnectInterval);
        };
    }, [isWsStashed, isTabActiveDelayed, reInitWs, isClient, info]);

    useEffect(() => {
        if (!isClient) return;
        if (isWsSleepMode) {
            if (info?.multiSocketInfo) {
                info.multiSocketInfo.enableSleepMode();
            } else {
                info?.wsManager?.setSleepMode(true);
            }
            setLastSleepMs(Date.now());
            stashSubscriptions();
        } else {
            if (info?.multiSocketInfo) {
                info.multiSocketInfo.disableSleepMode();
            } else {
                info?.wsManager?.setSleepMode(false);
            }
            setLastAwakeMs(Date.now());
        }
    }, [isWsSleepMode, info]);

    useEffect(() => {
        if (!isTabActiveDelayed) {
            console.log(
                '>>> useSDK | tab is inactive',
                new Date().toISOString(),
            );
            if (stashTimeoutRef.current) {
                clearTimeout(stashTimeoutRef.current);
            }

            stashTimeoutRef.current = setTimeout(() => {
                console.log('>>> useSDK | stashing', new Date().toISOString());
                stashWebsocket();
                setIsWsStashed(true);
            }, WS_SLEEP_MODE_STASH_CONNECTION);
        } else {
            if (info) {
                setTimeout(() => {
                    if (!info.multiSocketInfo) {
                        // [22-07-2025] was a mechanism for single socket mode
                        if (!info.wsManager?.isWsReady()) {
                            setShouldReconnect(true);
                        }
                    }
                }, 2000);
            }
            if (stashTimeoutRef.current) {
                clearTimeout(stashTimeoutRef.current);
            }
            setIsWsStashed(false);
        }

        return () => {
            if (stashTimeoutRef.current) {
                clearTimeout(stashTimeoutRef.current);
            }
        };
    }, [isTabActiveDelayed, info]);

    return (
        <SdkContext.Provider
            value={{ info: info, exchange: exchange, lastSleepMs, lastAwakeMs }}
        >
            {children}
        </SdkContext.Provider>
    );
};

export const useSdk = () => {
    const context = useContext(SdkContext);
    if (!context) {
        throw new Error('useSdk must be used within a SdkProvider');
    }
    return context;
};
