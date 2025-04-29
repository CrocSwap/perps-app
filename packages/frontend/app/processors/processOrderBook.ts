import type { L2BookData } from '@perps-app/sdk/src/utils/types';
import type {
    OrderBookTradeIF,
    OrderDataIF,
    OrderBookRowIF,
} from '../utils/orderbook/OrderBookIFs';
import { parseNum } from '../utils/orderbook/OrderBookUtils';

export function processOrderBookMessage(
    data: L2BookData,
    slice?: number,
): { sells: OrderBookRowIF[]; buys: OrderBookRowIF[] } {
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

    buysProcessed = buysProcessed.map((e, index) => {
        e.ratio = e.total / ratioPivot;
        return e;
    });

    sellsProcessed = sellsProcessed.map((e, index) => {
        e.ratio = e.total / ratioPivot;
        return e;
    });

    return { sells: sellsProcessed, buys: buysProcessed };
}

export function processTrades(data: any): OrderBookTradeIF[] {
    return data.map((e: any) => {
        return {
            coin: e.coin,
            side: e.side === 'A' ? 'sell' : 'buy',
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
    data: any,
    status: string,
): OrderDataIF | null {
    if (data) {
        return {
            coin: data.coin,
            cloid: data.cloid,
            oid: parseNum(data.oid),
            // side: e.side,
            side: data.side === 'A' ? 'sell' : 'buy',
            sz: parseNum(data.sz),
            tif: data.tif,
            timestamp: data.timestamp,
            status: status,
            limitPx: parseNum(data.limitPx),
            origSz: parseNum(data.origSz),
            reduceOnly: data.reduceOnly,
            isPositionTpsl: data.isPositionTpsl,
            isTrigger: data.isTrigger,
            triggerPx: parseNum(data.triggerPx),
            triggerCondition: data.triggerCondition,
            orderType: data.orderType || '',
            orderValue: parseNum(data.sz * data.limitPx),
        };
    }

    return null;
}
