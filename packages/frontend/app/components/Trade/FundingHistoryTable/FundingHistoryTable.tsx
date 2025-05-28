import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { sortUserFundings } from '~/processors/processUserFills';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { UserFundingIF, UserFundingSortBy } from '~/utils/UserDataIFs';
import FundingHistoryTableHeader from './FundingHistoryTableHeader';
import FundingHistoryTableRow from './FundingHistoryTableRow';

interface FundingHistoryTableProps {
    userFundings: UserFundingIF[];
    pageMode?: boolean;
    isFetched: boolean;
    selectedFilter?: string;
}

export default function FundingHistoryTable(props: FundingHistoryTableProps) {
    const { pageMode, isFetched, selectedFilter, userFundings } = props;

    const { symbol } = useTradeDataStore();

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return userFundings;
            case 'active':
                return userFundings.filter(
                    (funding) => funding.coin === symbol,
                );
            case 'long':
                return userFundings.filter((funding) => funding.szi > 0);
            case 'short':
                return userFundings.filter((funding) => funding.szi < 0);
        }

        return userFundings;
    }, [userFundings, selectedFilter, symbol]);

    const viewAllLink = useMemo(() => {
        return `/fundingHistory/${debugWallet.address}`;
    }, [debugWallet.address]);

    return (
        <>
            <GenericTable<UserFundingIF, UserFundingSortBy>
                storageKey={`FundingHistoryTable_${currentUserRef.current}`}
                data={filteredData}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <FundingHistoryTableHeader
                        sortBy={sortBy as UserFundingSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(fundingHistory, index) => (
                    <FundingHistoryTableRow
                        key={`funding-history-${index}`}
                        fundingHistory={fundingHistory}
                    />
                )}
                sorterMethod={sortUserFundings}
                isFetched={isFetched}
                pageMode={pageMode}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[1, 1, 1, 1, 1, 1]}
            />
        </>
    );
}
