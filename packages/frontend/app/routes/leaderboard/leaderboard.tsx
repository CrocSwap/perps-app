import { memo, useMemo } from 'react';
import {
    FaChevronDown,
    FaChevronLeft,
    FaChevronRight,
    FaChevronUp,
} from 'react-icons/fa';
import { LuSearch } from 'react-icons/lu';
import { MdClose, MdExpand } from 'react-icons/md';
import LeaderboardTable from '~/components/Leaderboard/LeaderboardTable/LeaderboardTable';
import useOutsideClick from '~/hooks/useOutsideClick';
import { leaderboardData } from './data';
import styles from './leaderboard.module.css';
import { useLeaderboard } from './useLeaderboard';

export function meta() {
    return [
        { title: 'Leaderboard | Ambient Finance' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

type Period = '30D' | '7D' | '24H';

// Define constants outside the component
const periods: { label: string; value: Period }[] = [
    { label: '30D', value: '30D' },
    { label: '7D', value: '7D' },
    { label: '24H', value: '24H' },
];

const rowsOptions = [10, 20, 50, 100];

function Leaderboard() {
    const {
        // State
        inputValue,
        period,
        isPeriodDropdownOpen,
        setIsPeriodDropdownOpen,
        isRowsDropdownOpen,
        setIsRowsDropdownOpen,
        rowsPerPage,
        // isFullScreen,
        sortConfig,

        // Calculated values
        totalRows,
        startRow,
        endRow,
        isPrevButtonDisabled,
        isNextButtonDisabled,

        // Data
        currentPageData,

        // Actions
        handleSearchChange,
        handleClearSearchInput,
        handlePeriodChange,
        handleRowsPerPageChange,
        goToNextPage,
        goToPreviousPage,
        handleSort,
        togglePeriodDropdown,
        toggleRowsDropdown,
        toggleFullScreen,
    } = useLeaderboard(leaderboardData);

    const isFullScreen = true;

    // Memoize the container class name
    const containerClassName = useMemo(() => {
        return `${styles.container} ${isFullScreen ? styles.fullScreen : ''}`;
    }, [isFullScreen]);

    // Memoize the period dropdown items
    const periodItems = useMemo(() => {
        return periods.map((p) => (
            <div
                key={p.value}
                className={styles.dropdownItem}
                onClick={() => handlePeriodChange(p.value)}
            >
                {p.label}
            </div>
        ));
    }, [handlePeriodChange]);

    const rowsItems = useMemo(() => {
        return rowsOptions.map((value) => (
            <div
                key={value}
                className={styles.dropdownItem}
                onClick={() => handleRowsPerPageChange(value)}
            >
                {value}
            </div>
        ));
    }, [handleRowsPerPageChange]);

    const periodDropdownRef = useOutsideClick<HTMLDivElement>(() => {
        setIsPeriodDropdownOpen(false);
    }, isPeriodDropdownOpen);
    const rowsDropdownRef = useOutsideClick<HTMLDivElement>(() => {
        setIsRowsDropdownOpen(false);
    }, isRowsDropdownOpen);

    return (
        <div className={containerClassName}>
            <header>Leaderboard</header>

            <div className={styles.content}>
                {/* Search and Period Row */}
                <div className={styles.searchRow}>
                    {/* Search Input */}
                    <div className={styles.searchContainer}>
                        <LuSearch size={16} />

                        <input
                            type='text'
                            className={styles.searchInput}
                            placeholder='Search by wallet address...'
                            value={inputValue}
                            onChange={handleSearchChange}
                        />
                        {inputValue && (
                            <MdClose
                                onClick={handleClearSearchInput}
                                size={18}
                            />
                        )}
                    </div>

                    {/* Period Selector */}
                    <div
                        className={styles.periodSelectorContainer}
                        ref={periodDropdownRef}
                    >
                        <div
                            className={styles.periodSelector}
                            onClick={togglePeriodDropdown}
                        >
                            <div className={styles.periodText}>{period}</div>
                            <FaChevronDown />

                            {isPeriodDropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    {periodItems}
                                </div>
                            )}
                        </div>
                        {rowsPerPage >= 20 && (
                            <MdExpand
                                size={14}
                                className={styles.expandIcon}
                                onClick={toggleFullScreen}
                            />
                        )}
                    </div>
                </div>

                {/* Leaderboard Table */}
                <LeaderboardTable
                    data={currentPageData}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    isFullScreen={isFullScreen}
                />

                {/* Pagination Controls */}
                <div className={styles.paginationContainer}>
                    <div className={styles.rowsPerPage}>
                        Rows per page:
                        <div
                            className={styles.rowSelector}
                            onClick={toggleRowsDropdown}
                            ref={rowsDropdownRef}
                        >
                            {rowsPerPage}
                            {/* <FaChevronDown className={styles.chvrDown} />{' '} */}
                            <FaChevronUp className={styles.chvrUp} />
                            {isRowsDropdownOpen && (
                                <div className={` ${styles.dropupMenu}`}>
                                    {rowsItems}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.pageInfo}>
                        {startRow}-{endRow} of {totalRows}
                    </div>

                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageButton}
                            onClick={goToPreviousPage}
                            disabled={isPrevButtonDisabled}
                        >
                            <FaChevronLeft size={20} />
                        </button>

                        <button
                            className={styles.pageButton}
                            onClick={goToNextPage}
                            disabled={isNextButtonDisabled}
                        >
                            <FaChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    Excludes accounts with less than 10k USDC account value and
                    less than 1M USDC trading volume. ROI = PNL / max(100,
                    starting account value + maximum net deposits) for the time
                    window.
                </div>
            </div>
        </div>
    );
}

// Use a custom comparison function to avoid unnecessary re-renders
const MemoizedLeaderboard = memo(Leaderboard);

export default MemoizedLeaderboard;
