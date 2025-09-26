import type { OrderDataSortBy } from '~/utils/orderbook/OrderBookIFs';
import styles from './OpenOrdersTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';
import { t } from 'i18next';

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
            name: t('tradeTable.time'),
            key: 'timestamp',
            sortable: true,
            className: styles.timeCell,
        },
        {
            name: t('tradeTable.type'),
            key: 'orderType',
            sortable: true,
            className: styles.typeCell,
        },
        {
            name: t('tradeTable.coin'),
            key: 'coin',
            sortable: true,
            className: styles.coinCell,
        },
        {
            name: t('tradeTable.direction'),
            key: 'side',
            sortable: true,
            className: styles.directionCell,
        },
        {
            name: t('tradeTable.size'),
            key: 'sz',
            sortable: true,
            className: styles.sizeCell,
        },
        {
            name: t('tradeTable.originalSize'),
            key: 'origSz',
            sortable: true,
            className: styles.originalSizeCell,
        },
        {
            name: t('tradeTable.orderValue'),
            key: 'orderValue',
            sortable: true,
            className: styles.orderValueCell,
        },
        {
            name: t('tradeTable.price'),
            key: 'price',
            sortable: true,
            className: styles.priceCell,
        },
        {
            name: t('tradeTable.reduceOnly'),
            key: 'reduceOnly',
            sortable: false,
            className: styles.reduceOnlyCell,
        },
        {
            name: t('tradeTable.triggerConditions'),
            key: 'triggerConditions',
            sortable: false,
            className: styles.triggerConditionsCell,
        },
        ...(showTpSl
            ? [
                  {
                      name: t('tradeTable.tpsl'),
                      key: 'tpsl' as OrderDataSortBy,
                      sortable: false,
                      className: styles.tpslCell,
                  },
              ]
            : []),
        {
            name: t('tradeTable.cancelAll'),
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
                            {t('tradeTable.cancelAll')}
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
