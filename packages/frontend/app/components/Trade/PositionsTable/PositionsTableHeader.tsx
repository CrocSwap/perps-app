import SortIcon from '~/components/Vault/SortIcon';
import styles from './PositionsTable.module.css';
import type { PositionIF, PositionDataSortBy } from '~/utils/UserDataIFs';
import type { TableSortDirection } from '~/utils/CommonIFs';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface PositionsTableHeaderProps {
    sortBy?: PositionDataSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: PositionDataSortBy) => void;
}

export default function PositionsTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
}: PositionsTableHeaderProps) {
    const tableHeaders: HeaderCell[] = [
        {
            name: 'Coin',
            key: 'coin',
            sortable: true,
            className: 'coinCell',
        },
        {
            name: 'Size',
            key: 'size',
            sortable: true,
            className: 'sizeCell',
        },
        {
            name: 'Position Value',
            key: 'positionValue',
            sortable: true,
            className: 'positionValueCell',
        },
        {
            name: 'Entry Price',
            key: 'entryPrice',
            sortable: true,
            className: 'entryPriceCell',
        },
        {
            name: 'Mark Price',
            key: 'markPrice',
            sortable: true,
            className: 'markPriceCell',
        },
        {
            name: 'PNL (ROE%)',
            key: 'pnl',
            sortable: true,
            className: 'pnlCell',
        },
        {
            name: 'Liq. Price',
            key: 'liqPrice',
            sortable: true,
            className: 'liqPriceCell',
        },
        {
            name: 'Margin',
            key: 'margin',
            sortable: true,
            className: 'marginCell',
        },
        {
            name: 'Funding',
            key: 'funding',
            sortable: true,
            className: 'fundingCell',
        },
        {
            name: 'TP/SL',
            key: 'tpsl',
            sortable: false,
            className: 'tpslCell',
        },
        {
            name: 'Close',
            key: 'close',
            sortable: false,
            className: 'closeCell',
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
                            sortClickHandler(header.key as PositionDataSortBy);
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
