import { useCallback, useEffect, useRef } from 'react';
import { useWs } from '~/contexts/WsContext';
import { useLiquidationStore } from '~/stores/LiquidationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import {
    type LiqLevel,
    type LiqLevelMessage,
    parseLiqLevelRaw,
} from './LiquidationUtils';

interface OBLiqFetcherProps {}

const OBLiqFetcher: React.FC<OBLiqFetcherProps> = () => {
    const { subscribe, unsubscribe } = useWs();

    const {
        setBuyLiqs,
        setSellLiqs,
        setLoadingState,
        setMaxLiqUSD,
        setMinLiqUSD,
        maxLiqUSD,
        minLiqUSD,
        buyLiqs,
        sellLiqs,
    } = useLiquidationStore();
    const maxLiqUSDRef = useRef(maxLiqUSD);
    const minLiqUSDRef = useRef(minLiqUSD);
    const buyLiqsRef = useRef(buyLiqs);
    buyLiqsRef.current = buyLiqs;
    const sellLiqsRef = useRef(sellLiqs);
    sellLiqsRef.current = sellLiqs;

    const { symbolInfo } = useTradeDataStore();
    const symbolInfoRef = useRef<SymbolInfoIF | null>(null);
    symbolInfoRef.current = symbolInfo;

    // Subscribe to liquidationLevels from ember2 endpoint
    useEffect(() => {
        const config = {
            handler: handleLiquidationLevels,
            payload: { marketId: 64 },
        };

        subscribe('liquidationLevels', config);

        if (
            buyLiqsRef.current.length === 0 &&
            sellLiqsRef.current.length === 0
        ) {
            setLoadingState(TableState.LOADING);
        } else {
            setLoadingState(TableState.FILLED);
        }

        return () => {
            unsubscribe('liquidationLevels', config);
        };
    }, [subscribe, unsubscribe]);

    const handleLiquidationLevels = useCallback((data: LiqLevelMessage) => {
        const markPx = symbolInfoRef.current?.markPx;
        if (!markPx) return;

        setLoadingState(TableState.FILLED);
        const levels = data.market.aggregated.levels;

        const buys = levels
            .filter((level) => level[0] / 1e6 <= markPx)
            .reverse();

        const buysMaxSz = buys.reduce(
            (max, level) => Math.max(max, level[1] / 1e8),
            0,
        );

        const buysMinSz = buys.reduce(
            (min, level) => Math.min(min, level[1] / 1e8),
            Infinity,
        );

        const buysTotalSz = buys.reduce(
            (total, level) => total + level[1] / 1e8,
            0,
        );

        const sells = levels.filter((level) => level[0] / 1e6 > markPx);
        const sellsMaxSz = sells.reduce(
            (max, level) => Math.max(max, level[1] / 1e8),
            0,
        );

        const sellsMinSz = sells.reduce(
            (min, level) => Math.min(min, level[1] / 1e8),
            Infinity,
        );

        const maxSz = Math.max(buysMaxSz, sellsMaxSz);
        const minSz = Math.min(buysMinSz, sellsMinSz);

        const sellsTotalSz = sells.reduce(
            (total, level) => total + level[1] / 1e8,
            0,
        );

        let cumulativeSz = 0;

        const buyLiqs: LiqLevel[] = [];
        const sellLiqs: LiqLevel[] = [];

        buys.forEach((level) => {
            const liq = parseLiqLevelRaw(
                level,
                'buy',
                cumulativeSz,
                maxSz,
                buysTotalSz + sellsTotalSz,
            );
            buyLiqs.push(liq);
            cumulativeSz += liq.sz;
        });

        cumulativeSz = 0;
        sells.forEach((level) => {
            const liq = parseLiqLevelRaw(
                level,
                'sell',
                cumulativeSz,
                maxSz,
                buysTotalSz + sellsTotalSz,
            );
            sellLiqs.push(liq);
            cumulativeSz += liq.sz;
        });

        setBuyLiqs(buyLiqs);
        setSellLiqs(sellLiqs);

        if (maxLiqUSDRef.current === 0) {
            setMaxLiqUSD(maxSz * (symbolInfoRef.current?.markPx ?? 0) * 5);
        }
        if (minLiqUSDRef.current === 0) {
            setMinLiqUSD(minSz * (symbolInfoRef.current?.markPx ?? 0));
        }
    }, []);

    return <></>;
};

export default OBLiqFetcher;
