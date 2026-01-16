import { memo, useMemo, useCallback } from 'react';
import SortIcon from '~/components/SortIcon/SortIcon';
import styles from './ReferralsTable.module.css';
import type { ReferralData } from './data';

export interface HeaderCell {
    name: string;
    key: string;
    sortable: boolean;
    className: string;
}

interface ReferralsTableHeaderProps {
    sortConfig: {
        key: string;
        direction: 'asc' | 'desc' | null;
    } | null;
    onSort: (key: keyof ReferralData) => void;
}

function ReferralsTableHeader({
    sortConfig,
    onSort,
}: ReferralsTableHeaderProps) {
    // Memoize so it's not recreated on every render
    const tableHeadersConfig = useMemo<HeaderCell[]>(
        () => [
            {
                name: 'Address',
                key: 'address',
                sortable: true,
                className: 'addressCell',
            },
            {
                name: 'Total Volume',
                key: 'totalVolume',
                sortable: true,
                className: 'volumeCell',
            },
            {
                name: 'Fees Paid',
                key: 'feesPaid',
                sortable: true,
                className: 'feesCell',
            },
            {
                name: 'Your Rewards',
                key: 'yourRewards',
                sortable: true,
                className: 'rewardsCell',
            },
        ],
        [],
    );

    const handleHeaderClick = useCallback(
        (key: string) => {
            return () => onSort(key as keyof ReferralData);
        },
        [onSort],
    );

    const headerCells = useMemo(() => {
        return tableHeadersConfig.map((header) => {
            const isActive = sortConfig?.key === header.key;
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
                            direction={isActive ? sortConfig?.direction : null}
                        />
                    )}
                </div>
            );
        });
    }, [tableHeadersConfig, sortConfig, handleHeaderClick]);

    return <div className={styles.headerContainer}>{headerCells}</div>;
}

// prevent re-renders when props haven't changed
export default memo(ReferralsTableHeader, (prevProps, nextProps) => {
    if (!prevProps.sortConfig && !nextProps.sortConfig) return true;
    if (!prevProps.sortConfig || !nextProps.sortConfig) return false;

    return (
        prevProps.sortConfig.key === nextProps.sortConfig.key &&
        prevProps.sortConfig.direction === nextProps.sortConfig.direction
    );
});
