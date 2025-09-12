import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import { OrderHistoryTableHeader } from './OrderHistoryTableHeader';
import OrderHistoryTableRow from './OrderHistoryTableRow';

interface OrderHistoryTableProps {
    selectedFilter?: string;
    pageMode?: boolean;
    data: OrderDataIF[];
    isFetched: boolean;
}

export function OrderHistoryTable(props: OrderHistoryTableProps) {
    const { selectedFilter, pageMode, data, isFetched } = props;

    const { symbol, filterOrderHistory } = useTradeDataStore();

    const { fetchOrderHistory } = useInfoApi();

    const { userAddress } = useUserDataStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = userAddress;

    const filteredOrderHistory = useMemo(() => {
        return filterOrderHistory(data, selectedFilter);
    }, [data, selectedFilter, symbol]);

    const viewAllLink = useMemo(() => {
        return `${EXTERNAL_PAGE_URL_PREFIX}/orderHistory/${userAddress}`;
    }, [userAddress]);

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
                noDataMessage='No order history'
                csvDataFetcher={fetchOrderHistory}
                csvDataFetcherArgs={[userAddress]}
            />
        </>
    );
}

export default OrderHistoryTable;
