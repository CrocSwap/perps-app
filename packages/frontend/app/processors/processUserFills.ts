import type {
    Fill,
    UserActiveTwap,
    UserFillsData,
    UserFunding,
    UserTwapHistoryData,
    UserTwapSliceFillsData,
} from '@perps-app/sdk/src/utils/types';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type {
    ActiveTwapIF,
    DepositAndWithDrawalIF,
    DepositAndWithDrawalSortBy,
    TwapHistoryIF,
    TwapSliceFillIF,
    UserFillIF,
    UserFillSortBy,
    UserFundingIF,
    UserFundingSortBy,
} from '~/utils/UserDataIFs';
import { parseNum } from '../utils/orderbook/OrderBookUtils';

export function processUserFills(data: UserFillsData): UserFillIF[] {
    const fillMap = new Map<string, UserFillIF>();

    data.fills.forEach((fill: Fill) => {
        // Create a unique key for deduplication based on coin, oid, and startPosition string
        const startPosRaw = fill.startPosition
            ? String(fill.startPosition)
            : undefined;
        const dedupeKey = startPosRaw
            ? `${fill.coin}-${fill.oid}-${startPosRaw}`
            : `${fill.coin}-${fill.oid}-${fill.tid}`; // Fallback to tid if no startPosition

        const processedFill: UserFillIF = {
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
            startPositionRaw: startPosRaw,
            startPosition: startPosRaw ? parseFloat(startPosRaw) : undefined,
        };

        // Only add if not already present (deduplication)
        if (!fillMap.has(dedupeKey)) {
            fillMap.set(dedupeKey, processedFill);
        }
    });

    // Convert map values back to array
    return Array.from(fillMap.values());
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
            case 'dir':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.dir.localeCompare(b.dir);
                    } else {
                        return b.dir.localeCompare(a.dir);
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
export function sortTwapHistory(
    fills: TwapHistoryIF[],
    sortBy: UserFillSortBy,
    sortDirection: TableSortDirection,
) {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'time':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.state.timestamp - b.state.timestamp;
                    } else {
                        return b.time - a.time;
                    }
                });
            case 'coin':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.state.coin.localeCompare(b.state.coin);
                    } else {
                        return b.state.coin.localeCompare(a.state.coin);
                    }
                });
            case 'side':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.state.sz - b.state.sz;
                    } else {
                        return b.state.sz - a.state.sz;
                    }
                });
            case 'px':
                return [...fills].sort((a, b) => {
                    const toNum = (px?: number): number | null =>
                        px != null && px > 0 ? px : null;

                    const aNum = toNum(a.state.executedSz);
                    const bNum = toNum(b.state.executedSz);

                    if (aNum === null && bNum === null) return 0;
                    if (aNum === null) return sortDirection === 'asc' ? 1 : -1;
                    if (bNum === null) return sortDirection === 'asc' ? -1 : 1;
                    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
                });

            case 'sz':
                return [...fills].sort((a, b) => {
                    const getAvg = (
                        nt: number | undefined,
                        sz: number | undefined,
                    ): number | null => {
                        if (nt == null || sz == null || sz <= 0) return null;
                        return nt / sz;
                    };

                    const aVal = getAvg(
                        a.state.executedNtl,
                        a.state.executedSz,
                    );
                    const bVal = getAvg(
                        b.state.executedNtl,
                        b.state.executedSz,
                    );

                    if (aVal === null && bVal === null) return 0;
                    if (aVal === null) return sortDirection === 'asc' ? 1 : -1;
                    if (bVal === null) return sortDirection === 'asc' ? -1 : 1;
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                });
            case 'value':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.state.minutes - b.state.minutes;
                    } else {
                        return b.state.minutes - a.state.minutes;
                    }
                });

            case 'fee':
                return [...fills].sort((a, b) => {
                    const aVal = a.state.reduceOnly ? 1 : 0;
                    const bVal = b.state.reduceOnly ? 1 : 0;
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                });

            case 'closedPnl':
                return [...fills].sort((a, b) => {
                    const aVal = a.state.randomize ? 1 : 0;
                    const bVal = b.state.randomize ? 1 : 0;
                    // asc: 0’s first, then 1’s; desc: 1’s first, then 0’s
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                });

            case 'status':
                return fills.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.status.localeCompare(b.status);
                    } else {
                        return b.status.localeCompare(a.status);
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

export function sortTwapFillHistory(
    fills: TwapSliceFillIF[],
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
                    const aRank = a.side === 'buy' ? 0 : 1;
                    const bRank = b.side === 'buy' ? 0 : 1;
                    return sortDirection === 'asc'
                        ? aRank - bRank
                        : bRank - aRank;
                });
            case 'px':
                return [...fills].sort((a, b) => {
                    return sortDirection === 'asc' ? a.px - b.px : b.px - a.px;
                });

            case 'sz':
                return [...fills].sort((a, b) => {
                    return sortDirection === 'asc' ? a.sz - b.sz : b.sz - a.sz;
                });
            case 'value':
                return [...fills].sort((a, b) => {
                    const aVal = a.px * a.sz;
                    const bVal = b.px * b.sz;
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                });

            case 'fee':
                return [...fills].sort((a, b) => {
                    return sortDirection === 'asc'
                        ? a.fee - b.fee
                        : b.fee - a.fee;
                });
            case 'closedPnl':
                return [...fills].sort((a, b) => {
                    const aVal = a.closedPnl - a.fee;
                    const bVal = b.closedPnl - b.fee;
                    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
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
    if (!data || !data.twapSliceFills) {
        console.warn('[TWAP SLICE FILLS] No twapSliceFills data found');
        return ret;
    }
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

export function processUserFundings(data: UserFunding[]): UserFundingIF[] {
    const ret: UserFundingIF[] = [];
    data.forEach((f) => {
        ret.push({
            time: f.time,
            coin: f.coin,
            usdc: parseFloat(f.usdc),
            szi: parseFloat(f.szi),
            fundingRate: parseFloat(f.fundingRate),
        } as UserFundingIF);
    });
    return ret;
}

export function processDepositWithdrawal(
    data: DepositAndWithDrawalIF[],
): DepositAndWithDrawalIF[] {
    const ret: DepositAndWithDrawalIF[] = [];
    data.forEach((f) => {
        ret.push({
            time: f.time,
            status: f.status,
            network: f.network,
            action: f.action,
            valueChange: f.valueChange,
            fee: f.fee,
        } as DepositAndWithDrawalIF);
    });
    return ret;
}

export function sortUserFundings(
    fundings: UserFundingIF[],
    sortBy: UserFundingSortBy,
    sortDirection: TableSortDirection,
) {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'time':
                return fundings.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.time - b.time;
                    } else {
                        return b.time - a.time;
                    }
                });
            case 'coin':
                return fundings.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.coin.localeCompare(b.coin);
                    } else {
                        return b.coin.localeCompare(a.coin);
                    }
                });
            case 'usdc':
                return fundings.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.usdc - b.usdc;
                    } else {
                        return b.usdc - a.usdc;
                    }
                });
            case 'szi':
                return fundings.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.szi - b.szi;
                    } else {
                        return b.szi - a.szi;
                    }
                });
            case 'fundingRate':
                return fundings.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.fundingRate - b.fundingRate;
                    } else {
                        return b.fundingRate - a.fundingRate;
                    }
                });
            default:
                return fundings.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.time - b.time;
                    } else {
                        return b.time - a.time;
                    }
                });
        }
    }
    return fundings;
}

export function sortDepositWithdrawal(
    depositAndWithdrawal: DepositAndWithDrawalIF[],
    sortBy: DepositAndWithDrawalSortBy,
    sortDirection: TableSortDirection,
) {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'time':
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.time - b.time;
                    } else {
                        return b.time - a.time;
                    }
                });
            case 'status':
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.status.localeCompare(b.status);
                    } else {
                        return b.status.localeCompare(a.status);
                    }
                });
            case 'network':
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.network.localeCompare(b.network);
                    } else {
                        return b.network.localeCompare(a.network);
                    }
                });
            case 'action':
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.action.localeCompare(b.action);
                    } else {
                        return b.action.localeCompare(a.action);
                    }
                });
            case 'valueChange':
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.valueChange.localeCompare(b.valueChange);
                    } else {
                        return b.valueChange.localeCompare(a.valueChange);
                    }
                });
            case 'fee':
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.fee.localeCompare(b.fee);
                    } else {
                        return b.fee.localeCompare(a.fee);
                    }
                });
            default:
                return depositAndWithdrawal.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.time - b.time;
                    } else {
                        return b.time - a.time;
                    }
                });
        }
    }
    return depositAndWithdrawal;
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
