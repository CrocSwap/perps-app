import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { sortTwapHistory } from '~/processors/processUserFills';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import type { TwapHistoryIF, UserFillSortBy } from '~/utils/UserDataIFs';
import HistoryTwapTableHeader from './HistoryTwapTableHeader';
import HistoryTwapTableRow from './HistoryTwapTableRow';
interface HistoryTwapTableProps {
    data: TwapHistoryIF[];
    isFetched: boolean;
    selectedFilter?: string;
    pageMode?: boolean;
}

export default function HistoryTwapTable(props: HistoryTwapTableProps) {
    const { data, isFetched, selectedFilter, pageMode } = props;

    const { symbol } = useTradeDataStore();

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const viewAllLink = useMemo(() => {
        return `/twapHistory/${currentUserRef.current}`;
    }, [debugWallet.address]);

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((twap) => twap.state.coin === symbol);
            case 'long':
                return data.filter((twap) => twap.state.side === 'buy');
            case 'short':
                return data.filter((twap) => twap.state.side === 'sell');
        }
        return data;
    }, [data, selectedFilter, symbol]);

    return (
        <>
            <GenericTable
                storageKey={`HistoryTwapTable_${currentUserRef.current}`}
                data={filteredData as any}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <HistoryTwapTableHeader
                        sortBy={sortBy as UserFillSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(twap, index) => (
                    <HistoryTwapTableRow
                        key={`twap-${index}`}
                        twap={twap as any}
                    />
                )}
                sorterMethod={sortTwapHistory}
                isFetched={isFetched}
                pageMode={pageMode}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[2, 1, 1, 1, 1, 1, 1, 1]}
                defaultSortBy={'time'}
                defaultSortDirection={'desc'}
                heightOverride={`${pageMode ? '100%' : '90%'}`}
            />
        </>
    );
}
