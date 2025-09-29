import SortIcon from '~/components/Vault/SortIcon';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { UserBalanceSortBy } from '~/utils/UserDataIFs';
import styles from './BalancesTable.module.css';
import { t } from 'i18next';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface BalancesTableHeaderProps {
    sortBy: UserBalanceSortBy;
    sortDirection: TableSortDirection;
    sortClickHandler: (key: UserBalanceSortBy) => void;
}

export default function BalancesTableHeader({
    sortBy,
    sortDirection,
    sortClickHandler,
}: BalancesTableHeaderProps) {
    const { selectedCurrency } = useTradeDataStore();

    const showSendButton = false;

    const tableHeaders: HeaderCell[] = [
        {
            name: t('tradeTable.coin'),
            key: 'sortName',
            sortable: true,
            className: styles.coinCell,
        },
        {
            name: t('tradeTable.totalBalance'),
            key: 'total',
            sortable: true,
            className: styles.totalBalanceCell,
        },
        {
            name: t('tradeTable.availableBalance'),
            key: 'available',
            sortable: true,
            className: styles.availableBalanceCell,
        },
        {
            name: t('tradeTable.currencyValue', { currency: selectedCurrency }),
            key: 'usdcValue',
            sortable: true,
            className: styles.usdcValueCell,
        },
        {
            name: t('tradeTable.buyingPower'),
            key: 'buyingPower',
            sortable: true,
            className: styles.buyingPowerCell,
        },
        {
            name: t('tradeTable.contract'),
            key: 'contract',
            sortable: false,
            className: styles.contractCell,
        },
        ...(showSendButton
            ? [
                  {
                      name: '',
                      key: 'action',
                      sortable: false,
                      className: styles.actionCell,
                  },
              ]
            : []),
    ];

    return (
        <div
            className={`${styles.headerContainer} ${!showSendButton ? styles.noSendButton : ''}`}
        >
            {tableHeaders.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} ${header.className} ${header.sortable ? styles.sortable : ''} ${header.key === sortBy ? styles.active : ''}`}
                    onClick={() => {
                        if (header.sortable) {
                            sortClickHandler(header.key as UserBalanceSortBy);
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
