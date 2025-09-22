import { useCallback, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaChevronUp } from 'react-icons/fa';
import styles from './Pagination.module.css';

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
            <div
                key={value}
                className={styles.dropdownItem}
                onClick={() => setRowsPerPageState(value)}
            >
                {value}
            </div>
        ));
    }, []);

    return (
        <>
            <div className={styles.paginationContainer}>
                <div className={styles.rowsPerPage}>
                    Rows per page:
                    <div
                        className={styles.rowSelector}
                        onClick={() =>
                            setIsRowsDropdownOpen(!isRowsDropdownOpen)
                        }
                    >
                        {rowsPerPageState}
                        <FaChevronUp className={styles.chvrUp} />
                        {isRowsDropdownOpen && (
                            <div className={` ${styles.dropupMenu}`}>
                                {rowsItems()}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.pageInfo}>
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
                        aria-label='Previous page'
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
                        aria-label='Next page'
                    >
                        <FaChevronRight size={20} aria-hidden='true' />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Pagination;
