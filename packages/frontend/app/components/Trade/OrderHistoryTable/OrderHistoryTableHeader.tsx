import type { TableSortDirection } from '~/utils/CommonIFs';
import styles from './OrderHistoryTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { OrderDataSortBy } from '~/utils/orderbook/OrderBookIFs';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface OrderHistoryTableHeaderProps {
    sortBy: OrderDataSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: string) => void;
}

export default function OrderHistoryTableHeader(
    props: OrderHistoryTableHeaderProps,
) {
    const { sortBy, sortDirection, sortClickHandler } = props;

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
            name: 'Filled Size',
            key: 'filledSz',
            sortable: true,
            className: 'filledSizeCell',
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
            sortable: true,
            className: 'reduceOnlyCell',
        },
        {
            name: 'Trigger Conditions',
            key: 'triggerConditions',
            sortable: true,
            className: 'triggerConditionsCell',
        },
        {
            name: 'TP/SL',
            key: 'tpsl',
            sortable: true,
            className: 'tpslCell',
        },
        {
            name: 'Status',
            key: 'status',
            sortable: true,
            className: 'statusCell',
        },
        {
            name: 'Order ID',
            key: 'oid',
            sortable: true,
            className: 'orderIdCell',
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
