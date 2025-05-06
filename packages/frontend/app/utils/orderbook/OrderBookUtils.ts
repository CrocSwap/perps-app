import type { TableSortDirection } from '../CommonIFs';
import type { SymbolInfoIF } from '../SymbolInfoIFs';
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
        nsigfigs: nsigfigs,
        val: mantissa
            ? parseFloat(Number(val * mantissa).toFixed(15))
            : Number(val),
        mantissa: mantissa || null,
    };
};

const floorNum = (num: number, precision?: number) => {
    if (precision) {
        return Math.floor(num * Math.pow(10, precision));
    }
    return Math.floor(num);
};

export const parseNum = (val: string | number) => {
    return Number(val);
};

export const formatDateToTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour12: false });
};

export const getResolutionListForPrice = (
    price: number | string,
): OrderRowResolutionIF[] => {
    const ret: OrderRowResolutionIF[] = [];

    const priceNum = Number(price);
    ret.push(createResolutionObject(priceNum, 5));
    ret.push(createResolutionObject(priceNum, 5, 2));
    ret.push(createResolutionObject(priceNum, 5, 5));
    ret.push(createResolutionObject(priceNum, 4));
    ret.push(createResolutionObject(priceNum, 3));
    ret.push(createResolutionObject(priceNum, 2));

    return ret;
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

export const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
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
                return [...orderData].sort((a, b) =>
                    sortDirection === 'asc' ? a.sz - b.sz : b.sz - a.sz,
                );
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
            default:
                return orderData;
        }
    }
    return orderData;
};
