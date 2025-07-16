import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { sortUserBalances } from '~/processors/processUserBalance';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { WsChannels } from '~/utils/Constants';
import BalancesTableHeader from './BalancesTableHeader';
import BalancesTableRow from './BalancesTableRow';

type BalancesTableProps = {
    hideSmallBalances: boolean;
};

export default function BalancesTable(props: BalancesTableProps) {
    const { debugWallet } = useDebugStore();
    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const { hideSmallBalances } = props;

    const smallBalanceThreshold = 10;

    const { userBalances, fetchedChannels } = useTradeDataStore();

    const webDataFetched = useMemo(() => {
        return fetchedChannels.has(WsChannels.WEB_DATA2);
    }, [fetchedChannels]);

    const balancesToShow = useMemo(() => {
        if (hideSmallBalances) {
            return userBalances.filter((balance) => {
                return balance.usdcValue > smallBalanceThreshold;
            });
        }
        return userBalances;
    }, [userBalances, hideSmallBalances]);

    return (
        <GenericTable
            storageKey={`BalancesTable_${currentUserRef.current}`}
            data={balancesToShow}
            renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                <BalancesTableHeader
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    sortClickHandler={sortClickHandler}
                />
            )}
            renderRow={(balance, index) => (
                <BalancesTableRow key={`balance-${index}`} balance={balance} />
            )}
            sorterMethod={sortUserBalances}
            isFetched={webDataFetched}
            pageMode={false}
            viewAllLink={''}
            skeletonRows={7}
            skeletonColRatios={[1, 2, 2, 1, 1, 1, 3]}
            defaultSortBy={'usdcValue'}
            defaultSortDirection={'desc'}
        />
    );
}
