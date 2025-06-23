import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { VaultDepositorSortBy } from '~/utils/VaultIFs';
import styles from './VaultDepositorsTable.module.css';

export interface HeaderCell {
    name: string;
    key: VaultDepositorSortBy;
    sortable: boolean;
    className: string;
}

interface VaultDepositorsTableHeaderProps {
    sortBy: VaultDepositorSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: VaultDepositorSortBy) => void;
}

export default function OpenOrdersTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
}: VaultDepositorsTableHeaderProps) {
    const tableHeaders: HeaderCell[] = [
        {
            name: 'Depositor',
            key: 'user',
            sortable: true,
            className: styles.timeCell,
        },
        {
            name: 'Vault Amount',
            key: 'vaultEquity',
            sortable: true,
            className: styles.typeCell,
        },
        {
            name: 'Unrealized PnL',
            key: 'pnl',
            sortable: true,
            className: styles.coinCell,
        },
        {
            name: 'All Time PnL',
            key: 'allTimePnl',
            sortable: true,
            className: styles.directionCell,
        },
        {
            name: 'Days Following',
            key: 'daysFollowing',
            sortable: true,
            className: styles.sizeCell,
        },
    ];

    return (
        <div className={styles.headerContainer}>
            {tableHeaders.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} ${header.className} ${header.sortable ? styles.sortable : ''} ${header.key === sortBy ? styles.active : ''}`}
                    onClick={() => {
                        if (header.sortable) {
                            sortClickHandler(header.key);
                        }
                    }}
                >
                    {header.name}
                    {header.sortable && (
                        <SortIcon
                            sortDirection={
                                sortDirection && header.key === sortBy
                                    ? sortDirection
                                    : undefined
                            }
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
