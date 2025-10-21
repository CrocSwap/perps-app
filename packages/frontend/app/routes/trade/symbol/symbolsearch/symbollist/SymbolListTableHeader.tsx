import styles from './symbollist.module.css';
import SortIcon from '~/components/Vault/SortIcon';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    onClick: (() => void) | undefined;
    className: string;
}

interface SymbolListTableHeaderProps {
    sortClickHandler: (key: string) => void;
    sortBy: string;
    sortDirection: string;
}

export default function SymbolListTableHeader({
    sortClickHandler,
    sortBy,
    sortDirection,
}: SymbolListTableHeaderProps) {
    const handleSort = (key: string) => {
        sortClickHandler(key);
    };

    const tableHeaders: HeaderCell[] = [
        {
            name: 'Symbol',
            key: 'symbol',
            sortable: true,
            onClick: () => handleSort('symbol'),
            className: styles.symbolCell,
        },
        {
            name: 'Last Price',
            key: 'lastPrice',
            sortable: true,
            onClick: () => handleSort('lastPrice'),
            className: styles.lastPriceCell,
        },
        {
            name: '24hr Change',
            key: 'change',
            sortable: true,
            onClick: () => handleSort('change'),
            className: styles.changeCell,
        },
        {
            name: '8hr Funding',
            key: 'funding',
            sortable: true,
            onClick: () => handleSort('funding'),
            className: styles.fundingCell,
        },
        {
            name: 'Volume',
            key: 'volume',
            sortable: true,
            onClick: () => handleSort('volume'),
            className: styles.volumeCell,
        },
        {
            name: 'Last / 24h',
            key: 'lastChangeCombo',
            sortable: true,
            onClick: () => handleSort('lastPrice'),
            className: styles.priceChangeCombo,
        },

        {
            name: 'Open Interest',
            key: 'openInterest',
            sortable: true,
            onClick: () => handleSort('openInterest'),
            className: styles.openInterestCell,
        },
    ];

    return (
        <div className={styles.headerContainer}>
            {tableHeaders.map((header) => (
                <div
                    key={header.key}
                    className={`${styles.cell} ${styles.headerCell} 
          ${header.className} ${header.sortable ? styles.sortable : ''} ${header.key === sortBy ? styles.active : ''}`}
                    onClick={header.onClick}
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
