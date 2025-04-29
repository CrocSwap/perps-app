import type { UserBalanceIF, UserBalanceSortBy } from '~/utils/UserDataIFs';
import { parseNum } from '../utils/orderbook/OrderBookUtils';
import type { TableSortDirection } from '~/utils/CommonIFs';

const coinConversion = (coin: string) => {
    if (coin === 'UBTC') {
        return 'BTC';
    }
    return coin;
};

const coinSortName = (coin: string) => {
    if (coin === 'USDC') {
        return '\x01';
    }
    return coin;
};

export function processUserBalance(
    data: any,
    type: 'spot' | 'margin',
    coinPriceMap: Map<string, number>,
): UserBalanceIF {
    const coin = coinConversion(data.coin);
    const usdcValue = parseNum(data.total) * (coinPriceMap.get(coin) || 0);
    const available = parseNum(data.total) - parseNum(data.hold);
    const buyingPower =
        (parseNum(data.total) - parseNum(data.hold)) *
        (coinPriceMap.get(coin) || 0);
    const pnlValue = usdcValue - parseNum(data.entryNtl);
    return {
        coin: coin,
        sortName: coinSortName(coin),
        type: type,
        hold: parseNum(data.hold),
        total: parseNum(data.total),
        entryNtl: parseNum(data.entryNtl),
        buyingPower: buyingPower,
        usdcValue: usdcValue,
        pnlValue: pnlValue,
        available: available,
        metaIndex: parseNum(data.token),
    };
}

export function sortUserBalances(
    balances: UserBalanceIF[],
    sortBy: UserBalanceSortBy,
    sortDirection: TableSortDirection,
) {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'sortName':
                return balances.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.sortName.localeCompare(b.sortName);
                    } else {
                        return b.sortName.localeCompare(a.sortName);
                    }
                });
            case 'total':
                return balances.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.total - b.total;
                    } else {
                        return b.total - a.total;
                    }
                });
            case 'available':
                return balances.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.available - b.available;
                    } else {
                        return b.available - a.available;
                    }
                });
            case 'usdcValue':
                return balances.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.usdcValue - b.usdcValue;
                    } else {
                        return b.usdcValue - a.usdcValue;
                    }
                });
            case 'pnlValue':
                return balances.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.pnlValue - b.pnlValue;
                    } else {
                        return b.pnlValue - a.pnlValue;
                    }
                });
            case 'buyingPower':
                return balances.sort((a, b) => {
                    if (sortDirection === 'asc') {
                        return a.buyingPower - b.buyingPower;
                    } else {
                        return b.buyingPower - a.buyingPower;
                    }
                });
            default:
                return balances;
        }
    }
    return balances;
}
