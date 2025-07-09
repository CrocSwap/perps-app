import {
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
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useDebugStore } from '~/stores/DebugStore';
import { useIsClient } from './useIsClient';
import { useAppStateStore } from '~/stores/AppStateStore';
import { WS_SLEEP_MODE_STASH_CONNECTION } from '~/utils/Constants';

type SdkContextType = {
    info: Info | null;
    exchange: Exchange | null;
};

const SdkContext = createContext<SdkContextType | undefined>(undefined);

export const SdkProvider: React.FC<{
    environment: Environment;
    children: React.ReactNode;
}> = ({ environment, children }) => {
    const isClient = useIsClient();

    const [info, setInfo] = useState<Info | null>(null);
    const [exchange, setExchange] = useState<Exchange | null>(null);
    const [shouldReconnect, setShouldReconnect] = useState(false);
    const stashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const stashedSubs = useRef<Record<string, ActiveSubscription[]>>({});

    const {
        internetConnected,
        setWsReconnecting,
        isWsStashed,
        setIsWsStashed,
        isTabActive,
    } = useAppStateStore();
    const { isWsSleepMode, setIsWsSleepMode } = useDebugStore();

    // commit to trigger deployment
    useEffect(() => {
        if (!isClient) return;
        if (!info) {
            const newInfo = new Info({
                environment,
                skipWs: false,
                // isDebug: true, // TODO: remove in prod
            });

            setInfo(newInfo);
            stashedSubs.current = {};
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
    }, [isClient, environment]);

    useEffect(() => {
        if (!internetConnected) {
            setShouldReconnect(true);
        }
    }, [internetConnected]);

    const stashSubscriptions = useCallback(() => {
        const activeSubs = info?.wsManager?.getActiveSubscriptions() || {};

        if (Object.keys(activeSubs).length !== 0) {
            // reset stashed subs if we can access active subs from ws object
            stashedSubs.current = {};
        }

        Object.keys(activeSubs).forEach((key) => {
            const subs = activeSubs[key];
            stashedSubs.current[key] = subs;
        });
        console.log(
            '>>> stashed subscriptions',
            stashedSubs.current,
            new Date().toISOString(),
        );
    }, [info]);

    const stashWebsocket = useCallback(() => {
        info?.wsManager?.stop();
        console.log('>>> stashed websocket', new Date().toISOString());
    }, [info]);

    const reInitWs = useCallback(() => {
        if (!isClient) return;

        info?.wsManager?.reInit(stashedSubs.current);
    }, [isClient, info]);

    useEffect(() => {
        if (!isClient) return;
        if (!isTabActive) return;

        if (internetConnected && shouldReconnect) {
            console.log('>>> alternate reconnect', new Date().toISOString());
            console.log(
                '>>> stashed subs',
                stashedSubs.current,
                new Date().toISOString(),
            );
            info?.wsManager?.reconnect(stashedSubs.current);
            setWsReconnecting(true);
            setShouldReconnect(false);
        }

        const reconnectInterval = setInterval(() => {
            if (info?.wsManager?.isWsReady()) {
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
        isTabActive,
        // isWsStashed,
        // isTabActive,
    ]);

    useEffect(() => {
        if (!isClient) return;

        if (isWsStashed && isTabActive) {
            console.log('>>> will re init ws object', new Date().toISOString());
            reInitWs();
            setWsReconnecting(true);
        }

        const reconnectInterval = setInterval(() => {
            if (info?.wsManager?.isWsReady()) {
                setWsReconnecting(false);
                clearInterval(reconnectInterval);
            }
        }, 200);

        return () => {
            clearInterval(reconnectInterval);
        };
    }, [isWsStashed, isTabActive, reInitWs, isClient, info]);

    useEffect(() => {
        if (!isClient) return;
        if (isWsSleepMode) {
            info?.wsManager?.setSleepMode(true);
            stashSubscriptions();
        } else {
            info?.wsManager?.setSleepMode(false);
        }
    }, [isWsSleepMode, info]);

    useEffect(() => {
        if (!isTabActive) {
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
                    if (!info.wsManager?.isWsReady()) {
                        setShouldReconnect(true);
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
    }, [isTabActive, info]);

    return (
        <SdkContext.Provider value={{ info: info, exchange: exchange }}>
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
