import { useMemo } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { sortUserFills } from '~/processors/processUserFills';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type { UserFillIF, UserFillSortBy } from '~/utils/UserDataIFs';
import TradeHistoryTableHeader from './TradeHistoryTableHeader';
import TradeHistoryTableRow from './TradeHistoryTableRow';
import { useTranslation } from 'react-i18next';
interface TradeHistoryTableProps {
    data: UserFillIF[];
    isFetched: boolean;
    selectedFilter?: string;
    onViewOrderDetails?: (time: string, coin: string) => void;
    onViewAll?: () => void;
    pageMode?: boolean;
    onClearFilter?: () => void;
}

export default function TradeHistoryTable(props: TradeHistoryTableProps) {
    const {
        data,
        isFetched,
        selectedFilter,
        onViewOrderDetails,
        pageMode,
        onClearFilter,
    } = props;

    const { symbol } = useTradeDataStore();

    const { fetchUserFills } = useInfoApi();

    const { userAddress } = useUserDataStore();

    const handleViewOrderDetails = (time: string, coin: string) => {
        if (onViewOrderDetails) {
            onViewOrderDetails(time, coin);
        }
    };

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((fill) => fill.coin === symbol);
            case 'long':
                return data.filter((fill) => fill.side === 'buy');
            case 'short':
                return data.filter((fill) => fill.side === 'sell');
        }

        return data;
    }, [data, selectedFilter, symbol]);

    const viewAllLink = useMemo(() => {
        return `${EXTERNAL_PAGE_URL_PREFIX}/tradeHistory/${userAddress}`;
    }, [userAddress]);

    const { t, i18n } = useTranslation();

    const noDataMessage = useMemo(() => {
        switch (selectedFilter) {
            case 'active':
                return t('tradeTable.noTradeHistoryForMarket', { symbol });
            case 'long':
                return t('tradeTable.noLongTradeHistory');
            case 'short':
                return t('tradeTable.noShortTradeHistory');
            default:
                return t('tradeTable.noTradeHistory');
        }
    }, [selectedFilter, symbol, i18n.language]);

    const showClearFilter = selectedFilter && selectedFilter !== 'all';

    return (
        <>
            <GenericTable<
                UserFillIF,
                UserFillSortBy,
                (
                    address: string,
                    aggregateByTime: boolean,
                ) => Promise<UserFillIF[]>
            >
                storageKey='TradeHistoryTable'
                noDataActionLabel={
                    showClearFilter ? t('common.clearFilter') : undefined
                }
                onNoDataAction={showClearFilter ? onClearFilter : undefined}
                data={filteredData}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <TradeHistoryTableHeader
                        sortBy={sortBy as UserFillSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(trade, index) => (
                    <TradeHistoryTableRow
                        key={`trade-${index}`}
                        trade={trade}
                        onViewOrderDetails={handleViewOrderDetails}
                    />
                )}
                sorterMethod={sortUserFills}
                isFetched={isFetched}
                pageMode={pageMode}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[2, 1, 1, 1, 1, 1, 1, 1]}
                defaultSortBy={'time'}
                defaultSortDirection={'desc'}
                noDataMessage={noDataMessage}
                csvDataFetcher={fetchUserFills}
                csvDataFetcherArgs={[userAddress, true]}
            />
        </>
    );
}
