import { memo, useState, useCallback } from 'react';
import styles from './ReferralsTable.module.css';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useReferralStore } from '~/stores/ReferralStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { FUUL_KEYS } from '~/components/Referrals/referralKeys';

function RewardHistoryTable() {
    const { currency } = useNumFormatter();
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

    const currentItems = rewardHistory || [];

    const isPrevButtonDisabled = rewardHistoryPage === 1;
    const isNextButtonDisabled =
        rewardHistoryPage === rewardHistoryTotalPages ||
        rewardHistoryTotalPages === 0;

    return (
        <div className={styles.tableWrapper}>
            <div className={styles.headerContainer}>
                <div className={`${styles.cell} ${styles.headerCell}`}>
                    Date
                </div>
                <div
                    className={`${styles.cell} ${styles.headerCell} ${styles.currencyCell}`}
                >
                    Currency
                </div>
                <div className={`${styles.cell} ${styles.headerCell}`}>
                    Amount
                </div>
                <div
                    className={`${styles.cell} ${styles.headerCell} ${styles.claimByCell}`}
                >
                    Claim By
                </div>
                <div
                    className={`${styles.cell} ${styles.headerCell} ${styles.statusCell}`}
                >
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
                                    {new Date(item.date).toLocaleDateString()}
                                </div>
                                <div
                                    className={`${styles.cell} ${styles.currencyCell}`}
                                >
                                    {item.currency_name}
                                </div>
                                <div className={styles.cell}>
                                    {currency(
                                        parseFloat(item.amount) * 0.000001,
                                    )}
                                </div>
                                <div
                                    className={`${styles.cell} ${styles.claimByCell}`}
                                >
                                    {new Date(
                                        item.deadline * 1000,
                                    ).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                                <div
                                    className={`${styles.cell} ${styles.statusCell}`}
                                >
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

            {currentItems.length > 0 && (
                <div className={styles.paginationContainer}>
                    <div className={styles.pageInfo}>
                        {`${(rewardHistoryPage - 1) * rewardHistoryPageSize + 1}-${Math.min(rewardHistoryPage * rewardHistoryPageSize, rewardHistoryTotalCount)} of ${rewardHistoryTotalCount}`}
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

export default memo(RewardHistoryTable);
