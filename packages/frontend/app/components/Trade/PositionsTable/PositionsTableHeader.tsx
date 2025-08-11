import SortIcon from '~/components/Vault/SortIcon';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { PositionDataSortBy } from '~/utils/UserDataIFs';
import styles from './PositionsTable.module.css';

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
    const showTpSl = true;

    const tableHeaders: HeaderCell[] = [
        {
            name: 'Coin',
            key: 'coin',
            sortable: true,
            className: styles.coinCell,
        },
        {
            name: 'Size',
            key: 'size',
            sortable: true,
            className: styles.sizeCell,
        },
        {
            name: 'Position Value',
            key: 'positionValue',
            sortable: true,
            className: styles.positionValueCell,
        },
        {
            name: 'Entry Price',
            key: 'entryPrice',
            sortable: true,
            className: styles.entryPriceCell,
        },
        {
            name: 'Mark Price',
            key: 'markPrice',
            sortable: true,
            className: styles.markPriceCell,
        },
        {
            name: 'PNL (ROE%)',
            key: 'pnl',
            sortable: true,
            className: styles.pnlCell,
        },
        {
            name: 'Liq. Price',
            key: 'liqPrice',
            sortable: true,
            className: styles.liqPriceCell,
        },
        {
            name: 'Margin',
            key: 'margin',
            sortable: true,
            className: styles.marginCell,
        },
        {
            name: 'Funding',
            key: 'funding',
            sortable: true,
            className: styles.fundingCell,
        },
        ...(showTpSl
            ? [
                  {
                      name: 'TP/SL',
                      key: 'tpsl',
                      sortable: false,
                      className: styles.tpslCell,
                  },
              ]
            : []),
        {
            name: 'Close',
            key: 'close',
            sortable: false,
            className: styles.closeCell,
        },
    ];

    return (
        <div
            className={`${styles.headerContainer} ${!showTpSl ? styles.noTpSl : ''}`}
        >
            {tableHeaders.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} ${header.className} ${header.sortable ? styles.sortable : ''}`}
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
