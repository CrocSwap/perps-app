import { useMemo, useState } from 'react';
import { sortUserBalances } from '~/processors/processUserBalance';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { UserBalanceSortBy } from '~/utils/UserDataIFs';
import styles from './BalancesTable.module.css';
import BalancesTableHeader from './BalancesTableHeader';
import BalancesTableRow from './BalancesTableRow';

type BalancesTableProps = {
    hideSmallBalances: boolean;
};

export default function BalancesTable(props: BalancesTableProps) {
    const { hideSmallBalances } = props;

    const smallBalanceThreshold = 10;

    const { userBalances } = useTradeDataStore();

    const [sortBy, setSortBy] = useState<UserBalanceSortBy>();
    const [sortDirection, setSortDirection] = useState<TableSortDirection>();

    const handleSort = (key: string) => {
        if (sortBy === key) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else if (sortDirection === 'asc') {
                setSortDirection(undefined);
                setSortBy(undefined);
            } else {
                setSortDirection('desc');
            }
        } else {
            setSortBy(key as UserBalanceSortBy);
            setSortDirection('desc');
        }
    };

    const sortedBalances = useMemo(() => {
        return sortUserBalances(userBalances, sortBy, sortDirection);
    }, [userBalances, sortBy, sortDirection]);

    const filteredBalances = useMemo(() => {
        if (hideSmallBalances) {
            return sortedBalances.filter((balance) => {
                return balance.usdcValue > smallBalanceThreshold;
            });
        }
        return sortedBalances;
    }, [sortedBalances, hideSmallBalances]);

    return (
        <div className={styles.tableWrapper}>
            <BalancesTableHeader
                sortBy={sortBy}
                sortDirection={sortDirection}
                sortClickHandler={handleSort}
            />
            <div className={styles.tableBody}>
                {filteredBalances.map((balance, index) => (
                    <BalancesTableRow
                        key={`balance-${index}`}
                        balance={balance}
                    />
                ))}

                {userBalances.length === 0 && (
                    <div
                        className={styles.container}
                        style={{ justifyContent: 'center', padding: '2rem 0' }}
                    >
                        No data to display
                    </div>
                )}
            </div>
        </div>
    );
}
