import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useNavigate } from 'react-router';
import GenericTablePagination from '~/components/Pagination/GenericTablePagination';
import NoDataRow from '~/components/Skeletons/NoDataRow';
import SkeletonTable from '~/components/Skeletons/SkeletonTable/SkeletonTable';
import { TableState, type TableSortDirection } from '~/utils/CommonIFs';
import styles from './GenericTable.module.css';
import { useIsClient } from '~/hooks/useIsClient';

interface GenericTableProps<T, S> {
    data: T[];
    renderHeader: (
        sortDirection: TableSortDirection,
        sortClickHandler: (key: S) => void,
        sortBy?: S,
    ) => React.ReactNode;
    renderRow: (row: T, index: number) => React.ReactNode;
    sorterMethod: (
        data: T[],
        sortBy: S,
        sortDirection: TableSortDirection,
        coinPriceMap?: Record<string, number>,
    ) => T[];
    isFetched: boolean;
    skeletonColRatios?: number[];
    skeletonRows?: number;
    slicedLimit?: number;
    pageMode?: boolean;
    viewAllLink?: string;
    defaultSortBy?: S;
    defaultSortDirection?: TableSortDirection;
    heightOverride?: string;
}

export default function GenericTable<T, S>(props: GenericTableProps<T, S>) {
    const id = useId();

    const {
        data,
        renderHeader,
        renderRow,
        sorterMethod,
        isFetched,
        pageMode,
        skeletonRows = 7,
        skeletonColRatios = [2, 1, 1.5, 1.5, 1.5, 1.5, 1, 1, 1],
        slicedLimit = 10,
        viewAllLink,
        defaultSortBy,
        defaultSortDirection,
        heightOverride = '100%',
    } = props;

    const navigate = useNavigate();

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const isClient = useIsClient();

    const checkShadow = useCallback(() => {
        const tableBody = document.getElementById(
            `${id}-tableBody`,
        ) as HTMLElement;
        const actionsContainer = document.getElementById(
            `${id}-actionsContainer`,
        ) as HTMLElement;

        if (!tableBody || !actionsContainer) {
            return;
        }

        const bottomNotShadowed =
            tableBody.scrollTop + tableBody.clientHeight >=
            tableBody.scrollHeight;
        if (bottomNotShadowed) {
            actionsContainer?.classList.add(styles.notShadowed);
        } else {
            actionsContainer?.classList.remove(styles.notShadowed);
        }
    }, []);

    useEffect(() => {
        checkShadow();

        let scrollEvent = null;
        const tableBody = document.getElementById(
            `${id}-tableBody`,
        ) as HTMLElement;

        if (tableBody) {
            scrollEvent = tableBody.addEventListener('scroll', (e: Event) => {
                checkShadow();
            });
        }

        return () => {
            if (scrollEvent) {
                tableBody.removeEventListener('scroll', scrollEvent);
            }
        };
    }, [tableState]);

    useEffect(() => {
        if (!isClient) {
            return;
        }
        const resizeEvent = () => {
            checkShadow();
        };
        window.addEventListener('resize', resizeEvent);

        return () => {
            if (isClient) {
                window.removeEventListener('resize', resizeEvent);
            }
        };
    }, [isClient]);

    const [sortBy, setSortBy] = useState<S>(defaultSortBy ?? (undefined as S));
    const [sortDirection, setSortDirection] = useState<TableSortDirection>(
        defaultSortDirection ?? 'desc',
    );

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        setPage(0);
    }, [sortBy, sortDirection]);

    const sortedData = useMemo(() => {
        if (sortBy) {
            return [...sorterMethod(data, sortBy, sortDirection)];
        }
        return data;
    }, [data, sortBy, sortDirection]);

    const dataToShow = useMemo(() => {
        if (pageMode) {
            return sortedData.slice(
                page * rowsPerPage,
                (page + 1) * rowsPerPage,
            );
        }
        return sortedData.slice(0, slicedLimit);
    }, [sortedData, pageMode, page, rowsPerPage]);

    const handleSort = (key: S) => {
        if (sortBy === key) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else if (sortDirection === 'asc') {
                setSortDirection(undefined);
                setSortBy(undefined as S);
            } else {
                setSortDirection('desc');
            }
        } else {
            setSortBy(key as S);
            setSortDirection('desc');
        }
    };

    const handleViewAll = (e: React.MouseEvent) => {
        e.preventDefault();
        if (viewAllLink) {
            navigate(viewAllLink, { viewTransition: true });
        }
    };

    const handleExportCsv = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('Exporting CSV');
    };

    useEffect(() => {
        if (isFetched) {
            if (dataToShow.length === 0) {
                setTableState(TableState.EMPTY);
            } else {
                setTableState(TableState.FILLED);
            }
        } else {
            setTableState(TableState.LOADING);
        }
    }, [dataToShow, isFetched]);

    return (
        <div className={styles.tableWrapper} style={{ height: heightOverride }}>
            {tableState === TableState.LOADING ? (
                <SkeletonTable
                    rows={skeletonRows}
                    colRatios={skeletonColRatios}
                />
            ) : (
                <>
                    <span
                        className={styles.headerContainer}
                        id={`${id}-headerContainer`}
                    >
                        {renderHeader(sortDirection, handleSort, sortBy)}
                    </span>
                    <div
                        id={`${id}-tableBody`}
                        className={`${styles.tableBody} 
                        ${pageMode ? styles.pageMode : styles.notPage}
                        `}
                    >
                        {tableState === TableState.FILLED &&
                            dataToShow.map(renderRow)}
                        {tableState === TableState.EMPTY && <NoDataRow />}
                        {sortedData.length > 0 && (
                            <div
                                id={`${id}-actionsContainer`}
                                className={styles.actionsContainer}
                            >
                                {sortedData.length > slicedLimit &&
                                    viewAllLink &&
                                    viewAllLink.length > 0 &&
                                    !pageMode && (
                                        <a
                                            href='#'
                                            className={styles.viewAllLink}
                                            onClick={handleViewAll}
                                        >
                                            View All
                                        </a>
                                    )}
                                {pageMode && (
                                    <a
                                        href='#'
                                        className={styles.exportLink}
                                        onClick={handleExportCsv}
                                    >
                                        Export as CSV
                                    </a>
                                )}
                            </div>
                        )}

                        {pageMode && (
                            <GenericTablePagination
                                totalCount={sortedData.length}
                                page={page}
                                setPage={setPage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={setRowsPerPage}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
