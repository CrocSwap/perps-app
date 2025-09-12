import type { HeaderCell, TableSortDirection } from '~/utils/CommonIFs';
import styles from './OrderHistoryTable.module.css';
import SortIcon from '~/components/Vault/SortIcon';
import type { OrderDataSortBy } from '~/utils/orderbook/OrderBookIFs';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import { t } from 'i18next';

export interface OrderHistoryTableHeaderProps {
    sortBy: OrderDataSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: OrderDataSortBy) => void;
}

const showTpSl = false;

// This is the model that can be imported by other components
export const getOrderHistoryTableModel = (): Array<
    HeaderCell<number> | HeaderCell<string>
> => [
    {
        name: t('tradeTable.time'),
        key: 'timestamp',
        sortable: true,
        className: 'timeCell',
        exportable: true,
        exportAction: (data: number) => {
            return formatTimestamp(data).replaceAll(';', ' ');
        },
    },
    {
        name: t('tradeTable.type'),
        key: 'orderType',
        sortable: true,
        className: 'typeCell',
        exportable: true,
    },
    {
        name: t('tradeTable.coin'),
        key: 'coin',
        sortable: true,
        className: 'coinCell',
        exportable: true,
    },
    {
        name: t('tradeTable.direction'),
        key: 'side',
        sortable: true,
        className: 'directionCell',
        exportable: true,
        exportAction: (data: number) => {
            return data.toString() === 'sell' ? 'Short' : 'Long';
        },
    },
    {
        name: t('tradeTable.size'),
        key: 'sz',
        sortable: true,
        className: 'sizeCell',
        exportable: true,
        exportAction: (v: number) => {
            return v > 0 ? Number(v.toFixed(4)).toString() : '--';
        },
    },
    {
        name: t('tradeTable.filledSize'),
        key: 'filledSz',
        sortable: true,
        className: 'filledSizeCell',
        exportable: true,
    },
    {
        name: t('tradeTable.orderValue'),
        key: 'orderValue',
        sortable: true,
        className: 'orderValueCell',
        exportable: true,
        exportAction: (v: number) => v.toFixed(3),
    },
    {
        name: t('tradeTable.price'),
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
        name: t('tradeTable.reduceOnly'),
        key: 'reduceOnly',
        sortable: true,
        className: 'reduceOnlyCell',
        exportable: true,
        exportAction: (data: boolean | string) => {
            return data === false ? 'No' : '--';
        },
    },
    {
        name: t('tradeTable.triggerConditions'),
        key: 'triggerCondition',
        sortable: true,
        className: 'triggerConditionsCell',
        exportable: true,
    },
    ...(showTpSl
        ? [
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
          ]
        : []),
    {
        name: t('tradeTable.status'),
        key: 'status',
        sortable: true,
        className: 'statusCell',
        exportable: true,
    },
    {
        name: t('tradeTable.orderId'),
        key: 'oid',
        sortable: true,
        className: 'orderIdCell',
        exportable: true,
        exportAction: (v: number) => String(v),
    },
];

export const OrderHistoryTableHeader = ({
    sortBy,
    sortDirection,
    sortClickHandler,
}: OrderHistoryTableHeaderProps) => {
    // Get the model inside the component to ensure it updates with language changes
    const OrderHistoryTableModel = getOrderHistoryTableModel();
    return (
        <div
            className={`${styles.headerContainer} ${!showTpSl ? styles.noTpSl : ''}`}
        >
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
};
