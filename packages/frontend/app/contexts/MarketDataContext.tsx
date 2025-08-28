import type { MetaAndAssetCtxsData } from '@perps-app/sdk/src/utils/types';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
} from 'react';
import { useRestPoller } from '~/hooks/useRestPoller';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TIMEOUT_MARKET_DATA_POLLING } from '~/utils/Constants';
import { parseNum } from '~/utils/orderbook/OrderBookUtils';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';

interface MarketDataContextType {}

export const MarketDataContext = createContext<MarketDataContextType>({});

export interface MarketDataProviderProps {
    children: React.ReactNode;
}

export const MarketDataProvider: React.FC<MarketDataProviderProps> = ({
    children,
}) => {
    const { subscribeToPoller, unsubscribeFromPoller } = useRestPoller();
    const { setCoins, setCoinPriceMap } = useTradeDataStore();

    const processMarketPollData = useCallback((data: MetaAndAssetCtxsData) => {
        const universe = data[0].universe;
        const assetCtxs = data[1];

        const coins: SymbolInfoIF[] = [];
        const coinPriceMap: Map<string, number> = new Map();

        universe.forEach((coin, index) => {
            const ctx = assetCtxs[index];

            coins.push({
                symbol: coin.name,
                coin: coin.name,
                dayBaseVlm: parseNum(ctx.dayBaseVlm),
                dayNtlVlm: parseNum(ctx.dayNtlVlm),
                funding: parseNum(ctx.funding),
                impactPxs: ctx.impactPxs
                    ? ctx.impactPxs.map((e: any) => parseNum(e))
                    : [],
                markPx: parseNum(ctx.markPx),
                midPx: parseNum(ctx.midPx),
                openInterest: parseNum(ctx.openInterest),
                oraclePx: parseNum(ctx.oraclePx),
                premium: parseNum(ctx.premium),
                prevDayPx: parseNum(ctx.prevDayPx),
                lastPriceChange: 0,
                last24hPriceChange: parseNum(
                    parseNum(ctx.markPx) - parseNum(ctx.prevDayPx),
                ),
                last24hPriceChangePercent: parseNum(
                    ((parseNum(ctx.markPx) - parseNum(ctx.prevDayPx)) /
                        parseNum(ctx.prevDayPx)) *
                        100,
                ),
                openInterestDollarized: parseNum(
                    parseNum(ctx.openInterest) * parseNum(ctx.oraclePx),
                ),
                szDecimals: coin.szDecimals,
                maxLeverage: coin.maxLeverage,
            });

            coinPriceMap.set(coin.name, coins[index].markPx);
        });

        setCoins(coins);
        setCoinPriceMap(coinPriceMap);
    }, []);

    useEffect(() => {
        const marketSub = {
            type: 'metaAndAssetCtxs',
        };

        subscribeToPoller(
            'info',
            marketSub,
            processMarketPollData,
            TIMEOUT_MARKET_DATA_POLLING,
            true,
        );

        return () => {
            unsubscribeFromPoller('info', marketSub);
        };
    }, []);

    return (
        <MarketDataContext.Provider value={{}}>
            {children}
        </MarketDataContext.Provider>
    );
};

export const useMarketData = () => useContext(MarketDataContext);
