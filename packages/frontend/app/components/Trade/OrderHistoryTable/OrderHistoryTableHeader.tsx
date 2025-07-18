import type { HeaderCell, TableSortDirection } from '~/utils/CommonIFs';
import styles from './OrderHistoryTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { OrderDataSortBy } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';

interface OrderHistoryTableHeaderProps {
    sortBy: OrderDataSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: OrderDataSortBy) => void;
}

export const OrderHistoryTableModel:
    | HeaderCell<number>[]
    | HeaderCell<string>[] = [
    {
        name: 'Time',
        key: 'timestamp',
        sortable: true,
        className: 'timeCell',
        exportable: true,
        exportAction: (data: number) => {
            return formatTimestamp(data).replaceAll(';', ' ');
        },
    },
    {
        name: 'Type',
        key: 'orderType',
        sortable: true,
        className: 'typeCell',
        exportable: true,
    },
    {
        name: 'Coin',
        key: 'coin',
        sortable: true,
        className: 'coinCell',
        exportable: true,
    },
    {
        name: 'Direction',
        key: 'side',
        sortable: true,
        className: 'directionCell',
        exportable: true,
        exportAction: (data: number) => {
            return data.toString() === 'sell' ? 'Short' : 'Long';
        },
    },
    {
        name: 'Size',
        key: 'sz',
        sortable: true,
        className: 'sizeCell',
        exportable: true,
        exportAction: (v: number) => v.toFixed(3),
    },
    {
        name: 'Filled Size',
        key: 'filledSz',
        sortable: true,
        className: 'filledSizeCell',
        exportable: true,
    },
    {
        name: 'Order Value',
        key: 'orderValue',
        sortable: true,
        className: 'orderValueCell',
        exportable: true,
        exportAction: (v: number) => v.toFixed(3),
    },
    {
        name: 'Price',
        key: 'limitPx',
        sortable: true,
        className: 'priceCell',
        exportable: true,
        exportAction: (v: number) =>
            v.toLocaleString('en-US', {
                useGrouping: false,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
    },
    {
        name: 'Reduce Only',
        key: 'reduceOnly',
        sortable: true,
        className: 'reduceOnlyCell',
        exportable: true,
        exportAction: (data: boolean | string) => {
            return data === false ? 'No' : '--';
        },
    },
    {
        name: 'Trigger Conditions',
        key: 'triggerCondition',
        sortable: true,
        className: 'triggerConditionsCell',
        exportable: true,
    },
    {
        name: 'TP/SL',
        key: 'triggerPx',
        sortable: true,
        className: 'tpslCell',
        exportable: true,
        exportAction: (data: number | null) => {
            console.log(data);
            return data && data > 0 ? data.toString() : '--';
        },
    },
    {
        name: 'Status',
        key: 'status',
        sortable: true,
        className: 'statusCell',
        exportable: true,
    },
    {
        name: 'Order ID',
        key: 'oid',
        sortable: true,
        className: 'orderIdCell',
        exportable: true,
        exportAction: (v: number) => String(v),
    },
];

export default function OrderHistoryTableHeader(
    props: OrderHistoryTableHeaderProps,
) {
    const { sortBy, sortDirection, sortClickHandler } = props;

    return (
        <div className={styles.headerContainer}>
            {OrderHistoryTableModel.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} ${styles[header.className]} ${header.sortable ? styles.sortable : ''} ${header.key === sortBy ? styles.active : ''}`}
                    onClick={() => {
                        if (header.sortable) {
                            sortClickHandler(header.key as OrderDataSortBy);
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
