import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useInfoApi } from '~/hooks/useInfoApi';
import { sortUserFills } from '~/processors/processUserFills';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type { UserFillIF, UserFillSortBy } from '~/utils/UserDataIFs';
import TradeHistoryTableHeader from './TradeHistoryTableHeader';
import TradeHistoryTableRow from './TradeHistoryTableRow';
interface TradeHistoryTableProps {
    data: UserFillIF[];
    isFetched: boolean;
    selectedFilter?: string;
    onViewOrderDetails?: (time: string, coin: string) => void;
    onViewAll?: () => void;
    pageMode?: boolean;
}

export default function TradeHistoryTable(props: TradeHistoryTableProps) {
    const { data, isFetched, selectedFilter, onViewOrderDetails, pageMode } =
        props;

    const { symbol } = useTradeDataStore();

    const { fetchUserFills } = useInfoApi();

    const { userAddress } = useUserDataStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = userAddress;

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
    }, [data, selectedFilter]);

    const viewAllLink = useMemo(() => {
        return `${EXTERNAL_PAGE_URL_PREFIX}/tradeHistory/${userAddress}`;
    }, [userAddress]);

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
                storageKey={`TradeHistoryTable_${currentUserRef.current}`}
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
                noDataMessage='No trade history'
                csvDataFetcher={fetchUserFills}
                csvDataFetcherArgs={[userAddress, true]}
            />
        </>
    );
}
