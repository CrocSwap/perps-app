import type { OrderDataSortBy } from '~/utils/orderbook/OrderBookIFs';
import styles from './OpenOrdersTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';

export interface HeaderCell {
    name: string;
    key: OrderDataSortBy;
    sortable: boolean;
    className: string;
}

interface OpenOrdersTableHeaderProps {
    sortBy: OrderDataSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: OrderDataSortBy) => void;
    hasActiveOrders?: boolean;
    onCancelAll?: () => void;
}

export default function OpenOrdersTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
    hasActiveOrders = false,
    onCancelAll,
}: OpenOrdersTableHeaderProps) {
    const showTpSl = false;

    const tableHeaders: HeaderCell[] = [
        {
            name: 'Time',
            key: 'timestamp',
            sortable: true,
            className: styles.timeCell,
        },
        {
            name: 'Type',
            key: 'orderType',
            sortable: true,
            className: styles.typeCell,
        },
        {
            name: 'Coin',
            key: 'coin',
            sortable: true,
            className: styles.coinCell,
        },
        {
            name: 'Direction',
            key: 'side',
            sortable: true,
            className: styles.directionCell,
        },
        {
            name: 'Size',
            key: 'sz',
            sortable: true,
            className: styles.sizeCell,
        },
        {
            name: 'Original Size',
            key: 'origSz',
            sortable: true,
            className: styles.originalSizeCell,
        },
        {
            name: 'Order Value',
            key: 'orderValue',
            sortable: true,
            className: styles.orderValueCell,
        },
        {
            name: 'Price',
            key: 'price',
            sortable: true,
            className: styles.priceCell,
        },
        {
            name: 'Reduce Only',
            key: 'reduceOnly',
            sortable: false,
            className: styles.reduceOnlyCell,
        },
        {
            name: 'Trigger Conditions',
            key: 'triggerConditions',
            sortable: false,
            className: styles.triggerConditionsCell,
        },
        ...(showTpSl
            ? [
                  {
                      name: 'TP/SL',
                      key: 'tpsl' as OrderDataSortBy,
                      sortable: false,
                      className: styles.tpslCell,
                  },
              ]
            : []),
        {
            name: 'Cancel All',
            key: 'cancel',
            sortable: false,
            className: styles.cancelCell,
        },
    ];

    return (
        <div
            className={`${styles.headerContainer} ${!showTpSl ? styles.noTpSl : ''}`}
        >
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
                    {header.key === 'cancel' ? (
                        <button
                            className={`${styles.cancelButton} ${!hasActiveOrders ? styles.disabled : ''}`}
                            onClick={
                                hasActiveOrders && onCancelAll
                                    ? onCancelAll
                                    : undefined
                            }
                            disabled={!hasActiveOrders}
                            type='button'
                        >
                            Cancel All
                        </button>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
