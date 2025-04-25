import { memo, useMemo, useCallback } from 'react';
import SortIcon from '~/components/SortIcon/SortIcon';
import styles from './LeaderboardTable.module.css';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface LeaderboardTableHeaderProps {
sortConfig: {
        key: string;
        direction: 'asc' | 'desc' | null;
    };
    onSort: (key: string) => void;
}

function LeaderboardTableHeader({
    sortConfig,
    onSort,
}: LeaderboardTableHeaderProps) {
    // Memoize  so it's not recreated on every render
    const tableHeadersConfig = useMemo<HeaderCell[]>(
        () => [
            {
                name: 'Rank',
                key: 'rank',
                sortable: true,
                className: 'rankCell',
            },
            {
                name: 'Trader',
                key: 'trader',
                sortable: true,
                className: 'traderCell',
            },
            {
                name: 'Account Value',
                key: 'accountValue',
                sortable: true,
                className: 'accountValueCell',
            },
            {
                name: 'PNL (30D)',
                key: 'pnl',
                sortable: true,
                className: 'pnlCell',
            },
            {
                name: 'ROI (30D)',
                key: 'roi',
                sortable: true,
                className: 'roiCell',
            },
            {
                name: 'Volume (30D)',
                key: 'volume',
                sortable: true,
                className: 'volumeCell',
            },
        ],
        [],
    );

    const handleHeaderClick = useCallback(
        (key: string) => {
            return () => onSort(key);
        },
        [onSort],
    );

    // Memoize to prevent unnecessary re-renders
    const headerCells = useMemo(() => {
        return tableHeadersConfig.map((header) => {
            const isActive = sortConfig.key === header.key;
            const cellClassName = `${styles.cell} ${styles.headerCell} ${styles[header.className]} ${header.sortable ? styles.sortable : ''}`;

            return (
                <div
                    key={header.key}
                    className={cellClassName}
                    onClick={
                        header.sortable
                            ? handleHeaderClick(header.key)
                            : undefined
                    }
                >
                    {header.name}
                    {header.sortable && (
                        <SortIcon
                            active={isActive}
                            direction={isActive ? sortConfig.direction : null}
                        />
                    )}
                </div>
            );
        });
    }, [tableHeadersConfig, sortConfig, handleHeaderClick]);

    return <div className={styles.headerContainer}>{headerCells}</div>;
}

// prevent re-renders when props haven't changed
export default memo(LeaderboardTableHeader, (prevProps, nextProps) => {
    // Custom comparison for more precise control over re-renders
    return (
        prevProps.sortConfig.key === nextProps.sortConfig.key &&
        prevProps.sortConfig.direction === nextProps.sortConfig.direction
    );
});
