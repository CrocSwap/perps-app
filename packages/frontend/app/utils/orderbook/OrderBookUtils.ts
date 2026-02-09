import type { TableSortDirection } from '../CommonIFs';
import type { SymbolInfoIF } from '../SymbolInfoIFs';
import type { ActiveTwapIF } from '../UserDataIFs';
import type {
    OrderDataIF,
    OrderDataSortBy,
    OrderRowResolutionIF,
} from './OrderBookIFs';

export const calculateResolutionValue = (
    price: number,
    nsigfigs = 2,
    mantissa?: number,
) => {
    const magnitude = Math.floor(Math.log10(price));
    const exponent = magnitude - (nsigfigs - 1);
    const tickSize = Math.pow(10, exponent);
    return Number((tickSize * (mantissa || 1)).toFixed(15));
};

export const createResolutionObject = (
    price: number,
    nsigfigs: number,
    mantissa?: number,
) => {
    return {
        nsigfigs: nsigfigs,
        val: calculateResolutionValue(price, nsigfigs, mantissa || 1),
        mantissa: mantissa || null,
    };
};
export const createResolutionObjectForVal = (
    val: number,
    nsigfigs: number,
    mantissa?: number,
) => {
    return {
        nsigfigs: nsigfigs < 0 ? null : nsigfigs,
        val: mantissa
            ? parseFloat(Number(val * mantissa).toFixed(15))
            : Number(val),
        mantissa: mantissa || null,
    };
};

// const floorNum = (num: number, precision?: number) => {
//     if (precision) {
//         return Math.floor(num * Math.pow(10, precision));
//     }
//     return Math.floor(num);
// };

export const parseNum = (val: string | number) => {
    return Number(val);
};

export const formatDateToTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour12: false });
};

export const getTimeUntilNextHour = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    const diff = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
    const minutes = Math.floor(diff / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');

    return `00:${minutes}:${seconds}`;
};

export const formatDiffAsCountdown = (diff: number) => {
    const hours = Math.floor(diff / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((diff % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

export const formatMinuteValue = (value: number) => {
    if (value <= 60) {
        return `${value} minutes`;
    } else if (value <= 1440) {
        return `${Math.floor(value / 60)} hours`;
    } else {
        return `${Math.floor(value / 1440)} days`;
    }
};

const decimalPrecision = (precisionNumber: number) => {
    if (!precisionNumber.toString().includes('.')) return 0;
    return precisionNumber.toString().split('.')[1].length;
};

export const getPrecisionForResolution = (
    resolution: OrderRowResolutionIF,
): number => {
    return decimalPrecision(resolution.val);
};

const get10PowForPrice = (price: number): number => {
    return Math.floor(Math.log10(price));
};

export const getResolutionListForSymbol = (
    symbol: SymbolInfoIF,
): OrderRowResolutionIF[] => {
    const ret: OrderRowResolutionIF[] = [];

    const price = symbol.markPx;

    const pricePow = get10PowForPrice(price);

    if (pricePow > -3) {
        if (pricePow - 4 > 0) {
            let temp = pricePow;
            while (temp - 4 > 0) {
                if (temp - 5 <= 0) {
                    ret.push(
                        createResolutionObjectForVal(
                            Math.pow(10, temp - 5),
                            -1,
                        ),
                    );
                }
                temp -= 1;
            }
        }

        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 4), 5));
        ret.push(
            createResolutionObjectForVal(Math.pow(10, pricePow - 4), 5, 2),
        );
        ret.push(
            createResolutionObjectForVal(Math.pow(10, pricePow - 4), 5, 5),
        );
        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 3), 4));
        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 2), 3));
        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 1), 2));
    } else {
        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 3), 4));
        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 2), 3));
        ret.push(createResolutionObjectForVal(Math.pow(10, pricePow - 1), 2));
    }

    return ret;
};

export const sortOrderData = (
    orderData: OrderDataIF[],
    sortBy: OrderDataSortBy,
    sortDirection: TableSortDirection,
) => {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'timestamp':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.timestamp - b.timestamp
                        : b.timestamp - a.timestamp,
                );
            case 'orderType':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.orderType?.localeCompare(b.orderType)
                        : b.orderType?.localeCompare(a.orderType),
                );
            case 'coin':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.coin.localeCompare(b.coin)
                        : b.coin.localeCompare(a.coin),
                );
            case 'side':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.side.localeCompare(b.side)
                        : b.side.localeCompare(a.side),
                );

            case 'sz':
                return [...orderData].sort((a, b) => {
                    const va = a.sz ?? -Infinity;
                    const vb = b.sz ?? -Infinity;
                    return sortDirection === 'asc' ? va - vb : vb - va;
                });

            case 'filledSz':
                return [...orderData].sort((a, b) => {
                    const va = a.filledSz ?? -Infinity;
                    const vb = b.filledSz ?? -Infinity;
                    return sortDirection === 'asc' ? va - vb : vb - va;
                });
            case 'origSz':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.origSz - b.origSz
                        : b.origSz - a.origSz,
                );
            case 'orderValue':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.orderValue ?? 0) - (b.orderValue ?? 0)
                        : (b.orderValue ?? 0) - (a.orderValue ?? 0),
                );
            case 'price':
            case 'limitPx':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.limitPx ?? 0) - (b.limitPx ?? 0)
                        : (b.limitPx ?? 0) - (a.limitPx ?? 0),
                );
            case 'status':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.status.localeCompare(b.status)
                        : b.status.localeCompare(a.status),
                );
            case 'triggerCondition':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.triggerCondition ?? '').localeCompare(
                              b.triggerCondition ?? '',
                          )
                        : (b.triggerCondition ?? '').localeCompare(
                              a.triggerCondition ?? '',
                          ),
                );
            case 'oid':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc' ? a.oid - b.oid : b.oid - a.oid,
                );
            case 'triggerPx':
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.triggerPx ?? 0) - (b.triggerPx ?? 0)
                        : (b.triggerPx ?? 0) - (a.triggerPx ?? 0),
                );
            case 'reduceOnly':
                return [...orderData].sort((a, b) => {
                    if (a.reduceOnly === b.reduceOnly) return 0;

                    if (sortDirection === 'asc') {
                        return a.reduceOnly ? 1 : -1;
                    }
                    return a.reduceOnly ? -1 : 1;
                });
            default:
                return orderData;
        }
    }
    return orderData;
};

export const genRandomActiveTwap = (): ActiveTwapIF => {
    const now = new Date();

    return {
        coin: 'MOODENG',
        side: 'buy',
        executedNtl: 229419.626593,
        executedSz: 729036.0,
        minutes: 1440,
        randomize: false,
        reduceOnly: false,
        sz: 4394047,
        timestamp: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            1,
            0,
            0,
            0,
        ).getTime(),
        user: '0x1cFd5AAa6893f7d91e2A0aA073EB7f634e871353',
    };
};

export const triggerPulseAnimation = (
    id: string,
    animClass = 'divPulseNeon',
    checkerClass: string,
) => {
    const el = document.getElementById(id);
    if (el?.classList.contains(checkerClass)) return;
    el?.classList.add(animClass);
    el?.classList.add(checkerClass);
    setTimeout(() => {
        el?.classList.remove(animClass);
    }, 800);
};
