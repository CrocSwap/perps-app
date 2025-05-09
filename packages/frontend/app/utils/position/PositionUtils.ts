import type { TableSortDirection } from '../CommonIFs';
import type { PositionDataSortBy, PositionIF } from './PositionIFs';

export const sortPositionData = (
    positionData: PositionIF[],
    sortBy: PositionDataSortBy,
    sortDirection: TableSortDirection,
    coinPriceMap: Map<string, number>,
) => {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'coin':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.coin.localeCompare(b.coin)
                        : b.coin.localeCompare(a.coin),
                );

            case 'size':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc' ? a.szi - b.szi : b.szi - a.szi,
                );

            case 'positionValue':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.positionValue ?? 0) - (b.positionValue ?? 0)
                        : (b.positionValue ?? 0) - (a.positionValue ?? 0),
                );
            case 'entryPrice':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.entryPx ?? 0) - (b.entryPx ?? 0)
                        : (b.entryPx ?? 0) - (a.entryPx ?? 0),
                );
            case 'markPrice':
                return [...positionData].sort(
                    (a, b) =>
                        (coinPriceMap.get(a.coin) ?? 0) -
                        (coinPriceMap.get(b.coin) ?? 0) *
                            (sortDirection === 'asc' ? 1 : -1),
                );
            case 'pnl':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.unrealizedPnl ?? 0) - (b.unrealizedPnl ?? 0)
                        : (b.unrealizedPnl ?? 0) - (a.unrealizedPnl ?? 0),
                );
            case 'liqPrice':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.liquidationPx ?? 0) - (b.liquidationPx ?? 0)
                        : (b.liquidationPx ?? 0) - (a.liquidationPx ?? 0),
                );
            case 'margin':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.marginUsed ?? 0) - (b.marginUsed ?? 0)
                        : (b.marginUsed ?? 0) - (a.marginUsed ?? 0),
                );

            case 'funding':
                return [...positionData].sort((a, b) =>
                    sortDirection === 'asc'
                        ? (a.cumFunding.allTime ?? 0) -
                          (b.cumFunding.allTime ?? 0)
                        : (b.marginUsed ?? 0) - (a.marginUsed ?? 0),
                );

            default:
                return positionData;
        }
    }
    return positionData;
};
