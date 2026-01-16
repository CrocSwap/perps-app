import { useCallback, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaChevronUp } from 'react-icons/fa';
import styles from './Pagination.module.css';
import { t } from 'i18next';

interface PaginationProps {
    totalCount: number;
    onPageChange: (page: number) => void;
    rowsPerPage: number;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
    totalCount,
    onPageChange,
    rowsPerPage,
    rowsOptions = [10, 20, 50, 100],
    onRowsPerPageChange,
}) => {
    const [rowsPerPageState, setRowsPerPageState] = useState(rowsPerPage);
    const [page, setPage] = useState(0);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    useEffect(() => {
        onPageChange(page);
    }, [page]);

    useEffect(() => {
        setPage(0);
        onRowsPerPageChange(rowsPerPageState);
    }, [rowsPerPageState]);

    const rowsItems = useCallback(() => {
        return rowsOptions.map((value) => (
            <button
                key={value}
                type='button'
                className={styles.dropdownItem}
                onClick={() => {
                    setRowsPerPageState(value);
                    setIsRowsDropdownOpen(false);
                }}
                role='option'
                aria-selected={value === rowsPerPageState}
            >
                {value}
            </button>
        ));
    }, [rowsPerPageState]);

    return (
        <>
            <div className={styles.paginationContainer}>
                <div className={styles.rowsPerPage}>
                    <span id='rows-per-page-label'>Rows per page:</span>
                    <button
                        type='button'
                        className={styles.rowSelector}
                        onClick={() =>
                            setIsRowsDropdownOpen(!isRowsDropdownOpen)
                        }
                        aria-haspopup='listbox'
                        aria-expanded={isRowsDropdownOpen}
                        aria-labelledby='rows-per-page-label'
                    >
                        {rowsPerPageState}
                        <FaChevronUp
                            className={styles.chvrUp}
                            aria-hidden='true'
                        />
                    </button>
                    {isRowsDropdownOpen && (
                        <div
                            className={styles.dropupMenu}
                            role='listbox'
                            aria-labelledby='rows-per-page-label'
                        >
                            {rowsItems()}
                        </div>
                    )}
                </div>

                <div
                    className={styles.pageInfo}
                    aria-live='polite'
                    aria-atomic='true'
                >
                    {page * rowsPerPageState + 1}-
                    {page * rowsPerPageState + rowsPerPageState > totalCount
                        ? totalCount
                        : page * rowsPerPageState + rowsPerPageState}{' '}
                    of {totalCount}
                </div>

                <div className={styles.pageButtons}>
                    <button
                        className={styles.pageButton}
                        onClick={() => {
                            if (page > 0) {
                                setPage(page - 1);
                            }
                        }}
                        disabled={page === 0}
                        aria-label={t('aria.previousPage')}
                    >
                        <FaChevronLeft size={20} aria-hidden='true' />
                    </button>

                    <button
                        className={styles.pageButton}
                        onClick={() => {
                            if (
                                page < Math.floor(totalCount / rowsPerPageState)
                            ) {
                                setPage(page + 1);
                            }
                        }}
                        disabled={
                            page === Math.floor(totalCount / rowsPerPageState)
                        }
                        aria-label={t('aria.nextPage')}
                    >
                        <FaChevronRight size={20} aria-hidden='true' />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Pagination;
