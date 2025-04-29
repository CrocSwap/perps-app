import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './BalancesTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { UserBalanceSortBy } from '~/utils/UserDataIFs';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface BalancesTableHeaderProps {
    sortBy: UserBalanceSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: string) => void;
}

export default function BalancesTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
}: BalancesTableHeaderProps) {
    const { selectedCurrency } = useTradeDataStore();

    const tableHeaders: HeaderCell[] = [
        {
            name: 'Coin',
            key: 'sortName',
            sortable: true,
            className: 'coinCell',
        },
        {
            name: 'Total Balance',
            key: 'total',
            sortable: true,
            className: 'totalBalanceCell',
        },
        {
            name: 'Available Balance',
            key: 'available',
            sortable: true,
            className: 'availableBalanceCell',
        },
        {
            name: `${selectedCurrency} Value`,
            key: 'usdcValue',
            sortable: true,
            className: 'usdcValueCell',
        },
        {
            name: 'Buying Power',
            key: 'buyingPower',
            sortable: true,
            className: 'buyingPowerCell',
        },
        {
            name: 'PNL (ROGER)',
            key: 'pnlValue',
            sortable: true,
            className: 'pnlCell',
        },
        {
            name: 'Contract',
            key: 'contract',
            sortable: false,
            className: 'contractCell',
        },
        {
            name: '',
            key: 'action',
            sortable: false,
            className: 'actionCell',
        },
    ];

    return (
        <div className={styles.headerContainer}>
            {tableHeaders.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} ${styles[header.className]} ${header.sortable ? styles.sortable : ''} ${header.key === sortBy ? styles.active : ''}`}
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
