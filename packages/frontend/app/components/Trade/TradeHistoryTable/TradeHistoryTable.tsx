import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { sortUserFills } from '~/processors/processUserFills';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
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

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

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
        return `/tradeHistory/${debugWallet.address}`;
    }, [debugWallet.address]);

    return (
        <>
            <GenericTable
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
            />
        </>
    );
}
