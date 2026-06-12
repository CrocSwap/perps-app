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
import { useAppStateStore } from '~/stores/AppStateStore';
import {
    WebSocketReadyState,
    WsLifecycleController,
    type WsLike,
    type WsSubscriptionConfig,
} from './wsLifecycle';

export type { WsSubscriptionConfig } from './wsLifecycle';

interface WsContextType {
    subscribe: (key: string, config: WsSubscriptionConfig) => void;
    unsubscribe: (key: string, config: WsSubscriptionConfig) => void;
    unsubscribeAllByChannel: (channel: string) => void;
    forceReconnect: () => void;
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

export const WsProvider: React.FC<WsProviderProps> = ({ children, url }) => {
    //----------------------------------- ws context

    const isClient = useIsClient();
    const [, setReadyState] = useState<number>(WebSocketReadyState.CLOSED);
    const controllerRef = useRef<WsLifecycleController | null>(null);

    const { isWsSleepMode } = useDebugStore();
    const { isTabActive, setWsReconnecting } = useAppStateStore();
    const isClientRef = useRef(isClient);
    isClientRef.current = isClient;
    const sleepModeRef = useRef(isWsSleepMode);
    sleepModeRef.current = isWsSleepMode;

    const { internetConnected } = useAppStateStore();
    const internetConnectedRef = useRef(internetConnected);
    internetConnectedRef.current = internetConnected;
    const isTabActiveRef = useRef(isTabActive);
    isTabActiveRef.current = isTabActive;

    const getController = useCallback(() => {
        if (!controllerRef.current) {
            controllerRef.current = new WsLifecycleController({
                url,
                createSocket: (socketUrl) =>
                    new WebSocket(socketUrl) as unknown as WsLike,
                getIsClient: () => isClientRef.current,
                getSleepMode: () => sleepModeRef.current,
                getInternetConnected: () => internetConnectedRef.current,
                getIsTabActive: () => isTabActiveRef.current,
                setWsReconnecting,
                setReadyState,
            });
        }

        return controllerRef.current;
    }, [setWsReconnecting, url]);

    useEffect(() => {
        if (!isClient) return;

        getController().connect();

        return () => {
            controllerRef.current?.cleanup();
            controllerRef.current = null;
        };
    }, [url, isClient, getController]); // ✅ Only runs when client-side is ready

    useEffect(() => {
        controllerRef.current?.handleInternetConnectedChange(internetConnected);
    }, [internetConnected]);

    useEffect(() => {
        controllerRef.current?.handleTabActiveChange(isTabActive);
    }, [isTabActive]);

    const subscribe = useCallback(
        (key: string, config: WsSubscriptionConfig) => {
            getController().subscribe(key, config);
        },
        [getController],
    );

    // unsubscribe all subscriptions by channel
    const unsubscribeAllByChannel = useCallback(
        (channel: string) => {
            getController().unsubscribeAllByChannel(channel);
        },
        [getController],
    );

    const unsubscribe = useCallback(
        (key: string, config: WsSubscriptionConfig) => {
            getController().unsubscribe(key, config);
        },
        [getController],
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

    const forceReconnect = useCallback(() => {
        getController().forceReconnect();
    }, [getController]);

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
