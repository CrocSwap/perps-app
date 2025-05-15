import type {
    UserActiveTwap,
    UserFillsData,
    UserTwapHistoryData,
    UserTwapSliceFillsData,
} from '@perps-app/sdk/src/utils/types';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type {
    TwapHistoryIF,
    TwapSliceFillIF,
    ActiveTwapIF,
    UserFillIF,
    UserFillSortBy,
} from '~/utils/UserDataIFs';
import { parseNum } from '../utils/orderbook/OrderBookUtils';

export function processUserFills(data: UserFillsData): UserFillIF[] {
    const ret: UserFillIF[] = [];
    data.fills.forEach((fill) => {
        ret.push({
            time: fill.time,
            coin: fill.coin,
            crossed: fill.crossed,
            dir: fill.dir,
            hash: fill.hash,
            oid: fill.oid,
            px: parseNum(fill.px),
            side: fill.side === 'A' ? 'sell' : 'buy',
            sz: parseNum(fill.sz),
            tid: fill.tid,
            fee: parseNum(fill.fee),
            value: parseNum(fill.sz) * parseNum(fill.px),
            closedPnl: parseFloat(fill.closedPnl),
        } as UserFillIF);
    });
    return ret;
}

export function sortUserFills(
    fills: UserFillIF[],
    sortBy: UserFillSortBy,
    sortDirection: TableSortDirection,
) {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'time':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.time - b.time;
                    } else {
                        return b.time - a.time;
                    }
                });
            case 'coin':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.coin.localeCompare(b.coin);
                    } else {
                        return b.coin.localeCompare(a.coin);
                    }
                });
            case 'side':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.side.localeCompare(b.side);
                    } else {
                        return b.side.localeCompare(a.side);
                    }
                });
            case 'px':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.px - b.px;
                    } else {
                        return b.px - a.px;
                    }
                });
            case 'sz':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.sz - b.sz;
                    } else {
                        return b.sz - a.sz;
                    }
                });
            case 'value':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.value - b.value;
                    } else {
                        return b.value - a.value;
                    }
                });
            case 'fee':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.fee - b.fee;
                    } else {
                        return b.fee - a.fee;
                    }
                });
            case 'closedPnl':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.closedPnl - b.closedPnl;
                    } else {
                        return b.closedPnl - a.closedPnl;
                    }
                });
            default:
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.time - b.time;
                    } else {
                        return b.time - a.time;
                    }
                });
        }
    }
    return fills.sort((a, b) => {
        if (sortDirection === 'asc') {
            return a.time - b.time;
        } else {
            return b.time - a.time;
        }
    });
}

export function processUserTwapSliceFills(
    data: UserTwapSliceFillsData,
): TwapSliceFillIF[] {
    const ret: TwapSliceFillIF[] = [];
    data.twapSliceFills.forEach((f) => {
        ret.push({
            coin: f.fill.coin,
            closedPnl: parseFloat(f.fill.closedPnl),
            crossed: f.fill.crossed,
            dir: f.fill.dir,
            fee: parseFloat(f.fill.fee),
            feeToken: f.fill.feeToken,
            hash: f.fill.hash,
            oid: f.fill.oid,
            px: parseFloat(f.fill.px),
            side: f.fill.side === 'A' ? 'sell' : 'buy',
            startPosition: parseFloat(f.fill.startPosition),
            sz: parseFloat(f.fill.sz),
            tid: f.fill.tid,
            time: f.fill.time,
            twapId: f.twapId,
        } as TwapSliceFillIF);
    });
    return ret;
}

export function processUserTwapHistory(
    data: UserTwapHistoryData,
): TwapHistoryIF[] {
    const ret: TwapHistoryIF[] = [];
    data.history.forEach((h) => {
        ret.push({
            state: {
                coin: h.state.coin,
                executedNtl: parseFloat(h.state.executedNtl),
                executedSz: parseFloat(h.state.executedSz),
                minutes: h.state.minutes,
                randomize: h.state.randomize,
                reduceOnly: h.state.reduceOnly,
                side: h.state.side === 'A' ? 'sell' : 'buy',
                sz: parseFloat(h.state.sz),
                timestamp: h.state.timestamp,
                user: h.state.user,
            },
            status: h.status.status,
            time: h.time,
        } as TwapHistoryIF);
    });
    return ret;
}

export function processUserActiveTwap(data: UserActiveTwap): ActiveTwapIF {
    return {
        coin: data.coin,
        executedNtl: parseFloat(data.executedNtl),
        executedSz: parseFloat(data.executedSz),
        minutes: data.minutes,
        randomize: data.randomize,
        reduceOnly: data.reduceOnly,
        side: data.side === 'A' ? 'sell' : 'buy',
        sz: parseFloat(data.sz),
        timestamp: data.timestamp,
        user: data.user,
    } as ActiveTwapIF;
}
