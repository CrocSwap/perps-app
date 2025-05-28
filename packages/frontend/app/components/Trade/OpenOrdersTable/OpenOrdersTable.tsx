import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import OpenOrdersTableHeader from './OpenOrdersTableHeader';
import OpenOrdersTableRow from './OpenOrdersTableRow';
interface OpenOrdersTableProps {
    data: OrderDataIF[];
    onCancel?: (time: number, coin: string) => void;
    onViewAll?: () => void;
    selectedFilter?: string;
    isFetched: boolean;
    pageMode?: boolean;
}

export default function OpenOrdersTable(props: OpenOrdersTableProps) {
    const { onCancel, selectedFilter, isFetched, pageMode, data } = props;

    const handleCancel = (time: number, coin: string) => {
        if (onCancel) {
            onCancel(time, coin);
        }
    };

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const { symbol } = useTradeDataStore();

    const filteredOrders = useMemo(() => {
        if (!selectedFilter) {
            return data;
        }

        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((order) => order.coin === symbol);
            case 'long':
                return data.filter((order) => order.side === 'buy');
            case 'short':
                return data.filter((order) => order.side === 'sell');
        }

        return data;
    }, [data, selectedFilter, symbol]);

    const viewAllLink = useMemo(() => {
        return `/openOrders/${debugWallet.address}`;
    }, [debugWallet.address]);

    return (
        <>
            <GenericTable
                storageKey={`OpenOrdersTable_${currentUserRef.current}`}
                data={filteredOrders}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <OpenOrdersTableHeader
                        sortBy={sortBy as OrderDataSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(order, index) => (
                    <OpenOrdersTableRow
                        key={`order-${index}`}
                        order={order}
                        onCancel={handleCancel}
                    />
                )}
                sorterMethod={sortOrderData}
                pageMode={pageMode}
                isFetched={isFetched}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[1, 2, 2, 1, 1, 2, 1, 1, 2, 3, 1]}
                defaultSortBy={'timestamp'}
                defaultSortDirection={'desc'}
            />
        </>
    );
}
