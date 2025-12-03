import { useMemo } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { sortTwapFillHistory } from '~/processors/processUserFills';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type { TwapSliceFillIF, UserFillSortBy } from '~/utils/UserDataIFs';
import FillTwapTableHeader from './FillTwapTableHeader';
import FillTwapTableRow from './FillTwapTableRow';

interface FillTwapTableProps {
    data: TwapSliceFillIF[];
    isFetched: boolean;
    selectedFilter?: string;
    pageMode?: boolean;
}

export default function FillTwapTable(props: FillTwapTableProps) {
    const { data, isFetched, selectedFilter, pageMode } = props;

    const { symbol } = useTradeDataStore();

    const { userAddress } = useUserDataStore();

    const viewAllLink = useMemo(() => {
        return `${EXTERNAL_PAGE_URL_PREFIX}/twapFillHistory/${userAddress}`;
    }, [userAddress]);

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((twap) => twap.coin === symbol);
            case 'long':
                return data.filter((twap) => twap.side === 'buy');
            case 'short':
                return data.filter((twap) => twap.side === 'sell');
        }
        return data;
    }, [data, selectedFilter, symbol]);

    return (
        <>
            <GenericTable
                storageKey='FillTwapTable'
                data={filteredData as any}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <FillTwapTableHeader
                        sortBy={sortBy as UserFillSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(fill, index) => (
                    <FillTwapTableRow
                        key={`fill-${index}`}
                        fill={fill as any}
                    />
                )}
                sorterMethod={sortTwapFillHistory}
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
