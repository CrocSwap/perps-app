import { memo } from 'react';
import styles from './ReferralsTable.module.css';
import ReferralsTableHeader from './ReferralsTableHeader';
import ReferralsTableRow from './ReferralsTableRow';
import { useReferralsTable } from './useReferralsTable';
import { referralData } from './data';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';

function ReferralsTable() {
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

    return (
        <div className={styles.tableWrapper}>
            <ReferralsTableHeader sortConfig={sortConfig} onSort={handleSort} />
            <div className={styles.tableBody}>
                {currentItems.map((referral, index) => (
                    <ReferralsTableRow
                        key={`referral-${index}`}
                        referral={referral}
                    />
                ))}

                {currentItems.length === 0 && (
                    <div
                        className={styles.rowContainer}
                        style={{ justifyContent: 'center', padding: '2rem 0' }}
                    >
                        No data to display
                    </div>
                )}
            </div>

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
        </div>
    );
}

export default memo(ReferralsTable);
