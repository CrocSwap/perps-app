import { t } from 'i18next';
import type { DepositAndWithDrawalSortBy } from '~/utils/UserDataIFs';
import styles from './DepositsWithdrawalsTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface DepositsWithdrawalsTableHeaderProps {
    sortBy?: DepositAndWithDrawalSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: DepositAndWithDrawalSortBy) => void;
}

export default function DepositsWithdrawalsTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
}: DepositsWithdrawalsTableHeaderProps) {
    const tableHeaders: HeaderCell[] = [
        {
            name: t('tradeTable.time'),
            key: 'time',
            sortable: true,
            className: 'timeCell',
        },
        {
            name: t('tradeTable.status'),
            key: 'status',
            sortable: true,
            className: 'statusCell',
        },
        {
            name: t('tradeTable.network'),
            key: 'network',
            sortable: true,
            className: 'networkCell',
        },
        {
            name: t('tradeTable.action'),
            key: 'action',
            sortable: true,
            className: 'actionCell',
        },
        {
            name: t('tradeTable.accountValueChange'),
            key: 'valueChange',
            sortable: true,
            className: 'valueChangeCell',
        },
        {
            name: t('tradeTable.fee'),
            key: 'fee',
            sortable: true,
            className: 'feeCell',
        },
    ];

    return (
        <div className={styles.headerContainer}>
            {tableHeaders.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} ${styles[header.className]} ${header.sortable ? styles.sortable : ''}`}
                    onClick={() => {
                        if (header.sortable) {
                            sortClickHandler(
                                header.key as DepositAndWithDrawalSortBy,
                            );
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
