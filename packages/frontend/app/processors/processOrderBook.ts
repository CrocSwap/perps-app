import type {
    L2BookData,
    OpenOrderRawData,
    OrderData,
} from '@perps-app/sdk/src/utils/types';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type {
    OrderBookRowIF,
    OrderBookTradeIF,
    OrderDataIF,
} from '../utils/orderbook/OrderBookIFs';
import { parseNum } from '../utils/orderbook/OrderBookUtils';

export function processOrderBookMessage(data: L2BookData): {
    sells: OrderBookRowIF[];
    buys: OrderBookRowIF[];
} {
    if (!data?.levels) {
        return {
            sells: [],
            buys: [],
        };
    }
    const buysRaw = data.levels[0];
    const sellsRaw = data.levels[1];

    let buyTotal = 0;
    let sellTotal = 0;
    let buysProcessed: OrderBookRowIF[] = buysRaw.map((e: any) => {
        buyTotal += parseFloat(e.sz);
        return {
            coin: data.coin,
            px: parseNum(e.px),
            sz: parseNum(e.sz),
            n: parseInt(e.n),
            type: 'buy',
            total: parseNum(buyTotal),
            ratio: 0,
        };
    });
    let sellsProcessed: OrderBookRowIF[] = sellsRaw.map((e: any) => {
        sellTotal += parseFloat(e.sz);
        return {
            coin: data.coin,
            px: parseNum(e.px),
            sz: parseNum(e.sz),
            n: parseInt(e.n),
            type: 'sell',
            total: parseNum(sellTotal),
            ratio: 0,
        };
    });
    const ratioPivot = sellTotal > buyTotal ? sellTotal : buyTotal;

    buysProcessed = buysProcessed.map((e) => {
        e.ratio = e.total / ratioPivot;
        return e;
    });

    sellsProcessed = sellsProcessed.map((e) => {
        e.ratio = e.total / ratioPivot;
        return e;
    });

    return { sells: sellsProcessed, buys: buysProcessed };
}

export function processTrades(data: any): OrderBookTradeIF[] {
    return data.map((e: any) => {
        return {
            coin: e.coin,
            side:
                e.side === 'A' || e.side === 'S'
                    ? 'sell'
                    : e.side === 'B'
                      ? 'buy'
                      : e.side,
            px: parseNum(e.px),
            sz: parseNum(e.sz),
            hash: e.hash,
            time: e.time,
            tid: e.tid,
            users: e.users,
        };
    });
}

export function processUserOrder(
    data: OrderData | OpenOrderRawData,
    status: string,
): OrderDataIF | null {
    if (data) {
        const markPx = useTradeDataStore.getState().symbolInfo?.markPx;
        const side =
            data.side === 'A' || data.side === 'S' || data.side === 'sell'
                ? 'sell'
                : data.side === 'B' || data.side === 'buy'
                  ? 'buy'
                  : null;

        if (!side) return null;

        const size = parseNum(data.sz);
        const originalSize = parseNum(data.origSz);
        return {
            coin: data.coin,
            cloid: data.cloid,
            oid: parseNum(data.oid),
            side,
            sz: size,
            tif: data.tif,
            timestamp: data.timestamp,
            status: status,
            limitPx: parseNum(data.limitPx),
            origSz: originalSize,
            filledSz: parseNum(originalSize - size),
            reduceOnly: data.reduceOnly,
            isPositionTpsl: data.isPositionTpsl,
            isTrigger: data.isTrigger,
            triggerPx: data.triggerPx ? parseNum(data.triggerPx) : undefined,
            triggerCondition: data.triggerCondition,
            orderType: data.orderType || '',
            orderValue: Math.round(size * (markPx || 1) * 100) / 100,
        };
    }

    return null;
}
