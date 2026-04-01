import { memo, useState, useCallback } from 'react';
import styles from './ReferralsTable.module.css';
import ReferralsTableHeader from './ReferralsTableHeader';
import ReferralsTableRow from './ReferralsTableRow';
import { useReferralsTable } from './useReferralsTable';
import { referralData } from './data';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useReferralStore } from '~/stores/ReferralStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { FUUL_KEYS } from '~/components/Referrals/referralKeys';
import type {
    PayoutByReferrerT,
    PayoutMovementIF,
} from '~/routes/referrals/referrals';

interface PropsIF {
    payoutMovements: PayoutMovementIF[];
    payoutsByReferrer: PayoutByReferrerT[];
    rewardHistory?: any[] | null;
    mode?: 'referrals' | 'rewardHistory';
}

function ReferralsTable(props: PropsIF) {
    const {
        payoutMovements,
        payoutsByReferrer,
        rewardHistory,
        mode = 'referrals',
    } = props;
    const { currency } = useNumFormatter();

    console.log(payoutMovements);

    const {
        currentItems,
        currentPage,
        totalPages,
        totalItems,

        startIndex,
        endIndex,
        goToNextPage,
        goToPreviousPage,
        sortConfig,
        handleSort,
    } = useReferralsTable({
        data: referralData,
        itemsPerPage: 10,
    });

    const isPrevButtonDisabled = currentPage === 1;
    const isNextButtonDisabled = currentPage === totalPages;

    if (mode === 'rewardHistory') {
        const userAddress = useUserDataStore((state) => state.userAddress);
        const {
            rewardHistory,
            rewardHistoryPage,
            rewardHistoryTotalCount,
            rewardHistoryPageSize,
            rewardHistoryTotalPages,
            fetchRewardHistory,
        } = useReferralStore();

        const [isLoading, setIsLoading] = useState(false);

        // Pagination actions
        const goToNextPage = useCallback(async () => {
            if (rewardHistoryPage < rewardHistoryTotalPages) {
                setIsLoading(true);
                await fetchRewardHistory(
                    userAddress ?? '',
                    FUUL_KEYS.NON_PERMISSIONED.READ_ONLY,
                    rewardHistoryPage + 1,
                );
                setIsLoading(false);
            }
        }, [
            rewardHistoryPage,
            rewardHistoryTotalPages,
            fetchRewardHistory,
            userAddress,
        ]);

        const goToPreviousPage = useCallback(async () => {
            if (rewardHistoryPage > 1) {
                setIsLoading(true);
                await fetchRewardHistory(
                    userAddress ?? '',
                    FUUL_KEYS.NON_PERMISSIONED.READ_ONLY,
                    rewardHistoryPage - 1,
                );
                setIsLoading(false);
            }
        }, [rewardHistoryPage, fetchRewardHistory, userAddress]);

        // Calculate indices
        const startIndex = (rewardHistoryPage - 1) * rewardHistoryPageSize;
        const endIndex = Math.min(
            startIndex + rewardHistoryPageSize - 1,
            rewardHistoryTotalCount - 1,
        );

        const currentItems = rewardHistory || [];
        const currentPage = rewardHistoryPage;
        const totalPages = rewardHistoryTotalPages;
        const totalItems = rewardHistoryTotalCount;

        const isPrevButtonDisabled = currentPage === 1;
        const isNextButtonDisabled =
            currentPage === totalPages || totalPages === 0;

        return (
            <div className={styles.tableWrapper}>
                <div className={styles.headerContainer}>
                    <div className={`${styles.cell} ${styles.headerCell}`}>
                        Date
                    </div>
                    <div className={`${styles.cell} ${styles.headerCell}`}>
                        Currency
                    </div>
                    <div className={`${styles.cell} ${styles.headerCell}`}>
                        Amount
                    </div>
                    <div className={`${styles.cell} ${styles.headerCell}`}>
                        Claim By
                    </div>
                    <div className={`${styles.cell} ${styles.headerCell}`}>
                        Status
                    </div>
                </div>
                <div className={styles.tableBody}>
                    {isLoading ? (
                        <div className={styles.emptyState}>Loading...</div>
                    ) : (
                        <>
                            {currentItems.map((item: any, index) => (
                                <div
                                    key={`reward-${index}`}
                                    className={styles.rowContainer}
                                >
                                    <div className={styles.cell}>
                                        {new Date(
                                            item.date,
                                        ).toLocaleDateString()}
                                    </div>
                                    <div className={styles.cell}>
                                        {item.currency_name}
                                    </div>
                                    <div className={styles.cell}>
                                        {currency(
                                            parseFloat(item.amount) * 0.000001,
                                        )}
                                    </div>
                                    <div className={styles.cell}>
                                        {new Date(
                                            item.deadline * 1000,
                                        ).toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </div>
                                    <div className={styles.cell}>
                                        <span
                                            className={
                                                item.status === 'claimed'
                                                    ? styles.claimedBadge
                                                    : styles.unclaimedBadge
                                            }
                                        >
                                            {item.status === 'claimed'
                                                ? 'Claimed'
                                                : 'Unclaimed'}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {currentItems.length === 0 && (
                                <div className={styles.emptyState}>
                                    No reward history to display
                                </div>
                            )}
                        </>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className={styles.paginationContainer}>
                        <div className={styles.pageInfo}>
                            {totalItems > 0
                                ? `${startIndex + 1}-${Math.min(endIndex + 1, totalItems)} of ${totalItems}`
                                : '0-0 of 0'}
                        </div>

                        <div className={styles.pageButtons}>
                            <button
                                className={styles.pageButton}
                                onClick={goToPreviousPage}
                                disabled={isPrevButtonDisabled || isLoading}
                            >
                                <BiChevronLeft size={16} />
                            </button>

                            <button
                                className={styles.pageButton}
                                onClick={goToNextPage}
                                disabled={isNextButtonDisabled || isLoading}
                            >
                                <BiChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.tableWrapper}>
            <ReferralsTableHeader sortConfig={sortConfig} onSort={handleSort} />
            <div className={styles.tableBody}>
                {payoutsByReferrer.map((referral, index) => (
                    <ReferralsTableRow
                        key={`referral-${index}`}
                        referral={referral}
                    />
                ))}

                {payoutsByReferrer.length === 0 && (
                    <div className={styles.emptyState}>No data to display</div>
                )}
            </div>

            {payoutsByReferrer.length > 0 && (
                <div className={styles.paginationContainer}>
                    <div className={styles.pageInfo}>
                        {totalItems > 0
                            ? `${startIndex + 1}-${Math.min(endIndex + 1, totalItems)} of ${totalItems}`
                            : '0-0 of 0'}
                    </div>

                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageButton}
                            onClick={goToPreviousPage}
                            disabled={isPrevButtonDisabled}
                        >
                            <BiChevronLeft size={16} />
                        </button>

                        <button
                            className={styles.pageButton}
                            onClick={goToNextPage}
                            disabled={isNextButtonDisabled}
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
