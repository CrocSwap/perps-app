import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import OrderHistoryTableHeader, {
    OrderHistoryTableModel,
} from './OrderHistoryTableHeader';
import OrderHistoryTableRow from './OrderHistoryTableRow';
import { useInfoApi } from '~/hooks/useInfoApi';

interface OrderHistoryTableProps {
    selectedFilter?: string;
    pageMode?: boolean;
    data: OrderDataIF[];
    isFetched: boolean;
}

export default function OrderHistoryTable(props: OrderHistoryTableProps) {
    const { selectedFilter, pageMode, data, isFetched } = props;

    const { symbol, filterOrderHistory } = useTradeDataStore();

    const { fetchOrderHistory } = useInfoApi();

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const filteredOrderHistory = useMemo(() => {
        return filterOrderHistory(data, selectedFilter);
    }, [data, selectedFilter, symbol]);

    const viewAllLink = useMemo(() => {
        return `/orderHistory/${debugWallet.address}`;
    }, [debugWallet.address]);

    return (
        <>
            <GenericTable<
                OrderDataIF,
                OrderDataSortBy,
                (address: string) => Promise<OrderDataIF[]>
            >
                storageKey={`OrderHistoryTable_${currentUserRef.current}`}
                data={filteredOrderHistory}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <OrderHistoryTableHeader
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(order, index) => (
                    <OrderHistoryTableRow
                        key={`order-${index}`}
                        order={order}
                    />
                )}
                sorterMethod={sortOrderData}
                isFetched={isFetched}
                pageMode={pageMode}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[1, 2, 2, 1, 1, 2, 1, 1, 2, 3, 1]}
                defaultSortBy={'timestamp'}
                defaultSortDirection={'desc'}
                tableModel={OrderHistoryTableModel}
                csvDataFetcher={fetchOrderHistory}
                csvDataFetcherArgs={[debugWallet.address]}
            />
        </>
    );
}
