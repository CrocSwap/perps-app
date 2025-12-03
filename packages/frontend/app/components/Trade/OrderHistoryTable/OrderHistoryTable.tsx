import { useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';

interface OrderHistoryTableProps {
    selectedFilter?: string;
    pageMode?: boolean;
    data: OrderDataIF[];
    isFetched: boolean;
    onClearFilter?: () => void;
}

export function OrderHistoryTable(props: OrderHistoryTableProps) {
    const { selectedFilter, pageMode, data, isFetched, onClearFilter } = props;

    const { symbol } = useTradeDataStore();

    const { fetchOrderHistory } = useInfoApi();

    const { userAddress } = useUserDataStore();

    const filteredOrderHistory = useMemo(() => {
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
        return `${EXTERNAL_PAGE_URL_PREFIX}/orderHistory/${userAddress}`;
    }, [userAddress]);

    const { t, i18n } = useTranslation();

    const noDataMessage = useMemo(() => {
        switch (selectedFilter) {
            case 'active':
                return t('tradeTable.noOrderHistoryForMarket', { symbol });
            case 'long':
                return t('tradeTable.noLongOrderHistory');
            case 'short':
                return t('tradeTable.noShortOrderHistory');
            default:
                return t('tradeTable.noOrderHistory');
        }
    }, [selectedFilter, symbol, i18n.language]);

    const showClearFilter = selectedFilter && selectedFilter !== 'all';

    return (
        <>
            <GenericTable<
                OrderDataIF,
                OrderDataSortBy,
                (address: string) => Promise<OrderDataIF[]>
            >
                storageKey='OrderHistoryTable'
                noDataActionLabel={
                    showClearFilter ? t('common.clearFilter') : undefined
                }
                onNoDataAction={showClearFilter ? onClearFilter : undefined}
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
                noDataMessage={noDataMessage}
                csvDataFetcher={fetchOrderHistory}
                csvDataFetcherArgs={[userAddress]}
            />
        </>
    );
}

export default OrderHistoryTable;
