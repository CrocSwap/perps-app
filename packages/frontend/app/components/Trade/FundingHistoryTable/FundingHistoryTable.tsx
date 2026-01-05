import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { sortUserFundings } from '~/processors/processUserFills';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type { UserFundingIF, UserFundingSortBy } from '~/utils/UserDataIFs';
import FundingHistoryTableHeader from './FundingHistoryTableHeader';
import FundingHistoryTableRow from './FundingHistoryTableRow';

interface FundingHistoryTableProps {
    userFundings: UserFundingIF[];
    pageMode?: boolean;
    isFetched: boolean;
    selectedFilter?: string;
    onClearFilter?: () => void;
}

export default function FundingHistoryTable(props: FundingHistoryTableProps) {
    const { pageMode, isFetched, selectedFilter, userFundings, onClearFilter } =
        props;

    const { symbol } = useTradeDataStore();

    const { userAddress } = useUserDataStore();

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
        return `${EXTERNAL_PAGE_URL_PREFIX}/fundingHistory/${userAddress}`;
    }, [userAddress]);

    const { t, i18n } = useTranslation();

    const noDataMessage = useMemo(() => {
        switch (selectedFilter) {
            case 'active':
                return t('tradeTable.noFundingHistoryForMarket', { symbol });
            case 'long':
                return t('tradeTable.noLongFundingHistory');
            case 'short':
                return t('tradeTable.noShortFundingHistory');
            default:
                return t('tradeTable.noFundingHistory');
        }
    }, [selectedFilter, symbol, i18n.language]);

    const showClearFilter = selectedFilter && selectedFilter !== 'all';

    return (
        <>
            <GenericTable
                storageKey='FundingHistoryTable'
                noDataMessage={noDataMessage}
                noDataActionLabel={
                    showClearFilter ? t('common.clearFilter') : undefined
                }
                onNoDataAction={showClearFilter ? onClearFilter : undefined}
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
