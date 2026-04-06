import { memo, useState, useMemo, useCallback } from 'react';
import styles from './ReferralsTable.module.css';
import ReferralsTableHeader from './ReferralsTableHeader';
import type { ReferralSortKey } from './ReferralsTableHeader';
import ReferralsTableRow from './ReferralsTableRow';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import type {
    PayoutByReferrerT,
    PayoutByReferrerEarningsT,
    PayoutMovementIF,
} from '~/routes/referrals/referrals';

const ITEMS_PER_PAGE = 3;

interface PropsIF {
    payoutMovements: PayoutMovementIF[];
    payoutsByReferrer: PayoutByReferrerT[];
}

function extractEntry(item: PayoutByReferrerT) {
    const [address, data] = Object.entries(item)[0];
    return { address, data };
}

function getReferralSortValue(item: PayoutByReferrerT, key: ReferralSortKey) {
    const { address, data } = extractEntry(item);
    switch (key) {
        case 'address':
            return address.toLowerCase();
        case 'totalVolume':
            return data.volume;
        case 'feesPaid':
            return 0;
        case 'yourRewards':
            return data.earnings.reduce(
                (acc: number, e: PayoutByReferrerEarningsT) => acc + e.amount,
                0,
            );
    }
}

function ReferralsTable(props: PropsIF) {
    const { payoutsByReferrer } = props;

    const [page, setPage] = useState(0);
    const [sortConfig, setSortConfig] = useState<{
        key: ReferralSortKey;
        direction: 'asc' | 'desc' | null;
    } | null>(null);

    const handleSort = useCallback((key: ReferralSortKey) => {
        setSortConfig((prev) => {
            if (prev?.key === key) {
                const next =
                    prev.direction === 'desc'
                        ? 'asc'
                        : prev.direction === 'asc'
                          ? null
                          : 'desc';
                return next ? { key, direction: next } : null;
            }
            return { key, direction: 'desc' };
        });
        setPage(0);
    }, []);

    const sortedData = useMemo(() => {
        if (!sortConfig || !sortConfig.direction) return payoutsByReferrer;
        const { key, direction } = sortConfig;
        return [...payoutsByReferrer].sort((a, b) => {
            const aVal = getReferralSortValue(a, key);
            const bVal = getReferralSortValue(b, key);
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [payoutsByReferrer, sortConfig]);

    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = page * ITEMS_PER_PAGE;
    const pageData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const endIndex = startIndex + pageData.length;

    return (
        <div className={styles.tableWrapper}>
            <ReferralsTableHeader sortConfig={sortConfig} onSort={handleSort} />
            <div className={styles.tableBody}>
                {pageData.map((referral, index) => (
                    <ReferralsTableRow
                        key={`referral-${startIndex + index}`}
                        referral={referral}
                    />
                ))}

                {payoutsByReferrer.length === 0 && (
                    <div className={styles.emptyState}>No data to display</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                    <div className={styles.pageInfo}>
                        {totalItems > 0
                            ? `${startIndex + 1}-${endIndex} of ${totalItems}`
                            : '0-0 of 0'}
                    </div>
                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageButton}
                            onClick={() => setPage((p) => p - 1)}
                            disabled={page === 0}
                        >
                            <BiChevronLeft size={16} />
                        </button>
                        <button
                            className={styles.pageButton}
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages - 1}
                        >
                            <BiChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(ReferralsTable);
