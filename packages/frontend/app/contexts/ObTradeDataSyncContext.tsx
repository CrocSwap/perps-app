import { useSession } from '@fogo/sessions-sdk-react';
import type { L2BookData } from '@perps-app/sdk/src/utils/types';
import React, {
    createContext,
    useContext,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';
import { useRestPoller } from '~/hooks/useRestPoller';
import { processOrderBookMessage } from '~/processors/processOrderBook';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';

interface ObTradeDataSyncContextType {}

export const ObTradeDataSyncContext = createContext<ObTradeDataSyncContextType>(
    {},
);

export interface ObTradeDataSyncProviderProps {
    children: React.ReactNode;
}

export const ObTradeDataSyncProvider: React.FC<
    ObTradeDataSyncProviderProps
> = ({ children }) => {
    const {
        symbol,
        symbolInfo,
        isMidModeActive,
        setOrderInputPriceValue,
        marketOrderType,
    } = useTradeDataStore();

    const marketOrderTypeRef = useRef(marketOrderType);
    marketOrderTypeRef.current = marketOrderType;
    const { subscribeToPoller, unsubscribeFromPoller } = useRestPoller();
    const { setMidPrice, midPrice } = useOrderBookStore();
    const midPriceRef = useRef(midPrice);
    midPriceRef.current = midPrice;

    useEffect(() => {
        if (!symbol) return;
        subscribeToPoller(
            'info',
            {
                type: 'l2Book' as const,
                coin: symbol,
            },
            (data: L2BookData) => {
                const { buys, sells } = processOrderBookMessage(data);
                setMidPrice((buys[0].px + sells[0].px) / 2);
            },
            3000,
            true,
        );

        return () => {
            unsubscribeFromPoller('info', {
                type: 'l2Book' as const,
                coin: symbol,
            });
        };
    }, [symbol]);

    useEffect(() => {
        if (midPriceRef.current) return;
        if (symbolInfo?.markPx) {
            setMidPrice(symbolInfo.markPx);
        }
    }, [symbolInfo?.markPx]);

    useEffect(() => {
        if (!isMidModeActive) return;
        if (!midPrice) return;
        if (marketOrderTypeRef.current === 'market') return;
        setOrderInputPriceValue({
            value: midPrice,
            changeType: 'midPriceChange',
        });
    }, [isMidModeActive, midPrice]);

    return (
        <ObTradeDataSyncContext.Provider value={{}}>
            {children}
        </ObTradeDataSyncContext.Provider>
    );
};

export const useObTradeDataSync = () => useContext(ObTradeDataSyncContext);
