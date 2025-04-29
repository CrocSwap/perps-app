import type { OrderDataSortBy } from '~/utils/orderbook/OrderBookIFs';
import styles from './OpenOrdersTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface OpenOrdersTableHeaderProps {
    sortBy: OrderDataSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: string) => void;
}

export default function OpenOrdersTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
}: OpenOrdersTableHeaderProps) {
    const tableHeaders: HeaderCell[] = [
        {
            name: 'Time',
            key: 'timestamp',
            sortable: true,
            className: 'timeCell',
        },
        {
            name: 'Type',
            key: 'orderType',
            sortable: true,
            className: 'typeCell',
        },
        {
            name: 'Coin',
            key: 'coin',
            sortable: true,
            className: 'coinCell',
        },
        {
            name: 'Direction',
            key: 'side',
            sortable: true,
            className: 'directionCell',
        },
        {
            name: 'Size',
            key: 'sz',
            sortable: true,
            className: 'sizeCell',
        },
        {
            name: 'Original Size',
            key: 'origSz',
            sortable: true,
            className: 'originalSizeCell',
        },
        {
            name: 'Order Value',
            key: 'orderValue',
            sortable: true,
            className: 'orderValueCell',
        },
        {
            name: 'Price',
            key: 'price',
            sortable: true,
            className: 'priceCell',
        },
        {
            name: 'Reduce Only',
            key: 'reduceOnly',
            sortable: false,
            className: 'reduceOnlyCell',
        },
        {
            name: 'Trigger Conditions',
            key: 'triggerConditions',
            sortable: false,
            className: 'triggerConditionsCell',
        },
        {
            name: 'TP/SL',
            key: 'tpsl',
            sortable: false,
            className: 'tpslCell',
        },
        {
            name: 'Cancel',
            key: 'cancel',
            sortable: false,
            className: 'cancelCell',
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
