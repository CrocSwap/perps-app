import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useIsClient } from './useIsClient';
import { Info, Exchange, type Environment, DEMO_USER } from '@perps-app/sdk';
import { useTradeDataStore } from '~/stores/TradeDataStore';

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

    const { internetConnected } = useTradeDataStore();
    const internetConnectedRef = useRef(internetConnected);

    const wsCloseListener = useCallback(() => {
        if (internetConnectedRef.current) {
            info?.wsManager?.reconnect();
        }
    }, []);

    // commit to trigger deployment

    useEffect(() => {
        if (!isClient) return;
        if (!info) {
            const newInfo = new Info({
                environment,
                skipWs: false,
                // isDebug: true, // TODO: remove in prod
            });

            newInfo.wsManager?.addCloseListener(wsCloseListener);
            setInfo(newInfo);
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
        if (!isClient) return;
        if (internetConnected) {
            info?.wsManager?.reconnect();
        }
    }, [internetConnected, isClient]);

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
