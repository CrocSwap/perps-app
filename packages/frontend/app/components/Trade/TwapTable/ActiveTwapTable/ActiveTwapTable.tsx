import { useMemo } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { ActiveTwapIF, ActiveTwapSortBy } from '~/utils/UserDataIFs';
import ActiveTwapTableHeader from './ActiveTwapTableHeader';
import ActiveTwapTableRow from './ActiveTwapTableRow';

interface ActiveTwapTableProps {
    data: ActiveTwapIF[];
    isFetched: boolean;
    selectedFilter?: string;
}

export default function ActiveTwapTable(props: ActiveTwapTableProps) {
    const { data, isFetched, selectedFilter } = props;
    const { symbol } = useTradeDataStore();

    const handleTerminate = (coin: string) => {
        console.log(`Terminating TWAP for ${coin}`);
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

    return (
        <>
            <GenericTable<ActiveTwapIF, ActiveTwapSortBy>
                data={filteredData}
                renderHeader={() => <ActiveTwapTableHeader />}
                renderRow={(twap) => (
                    <ActiveTwapTableRow
                        twap={twap}
                        onTerminate={handleTerminate}
                    />
                )}
                isFetched={isFetched}
                skeletonRows={7}
                skeletonColRatios={[2, 2, 2, 1, 2, 1, 2, 1]}
            />
        </>
    );
}
