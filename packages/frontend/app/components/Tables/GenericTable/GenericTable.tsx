import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import GenericTablePagination from '~/components/Pagination/GenericTablePagination';
import NoDataRow from '~/components/Skeletons/NoDataRow';
import SkeletonTable from '~/components/Skeletons/SkeletonTable/SkeletonTable';
import { TableState, type TableSortDirection } from '~/utils/CommonIFs';
import styles from './GenericTable.module.css';

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
    storageKey: string;
}

export default function GenericTable<T, S>(props: GenericTableProps<T, S>) {
    const id = props.storageKey;
    const navigate = useNavigate();

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

    function safeParse<T>(value: string | null, fallback: T): T {
        if (!value || value === 'undefined') return fallback;
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    const sortByKey = `GenericTable:${id}:sortBy`;
    const sortDirKey = `GenericTable:${id}:sortDir`;

    const [sortBy, setSortBy] = useState<S>(() => {
        const stored = localStorage.getItem(sortByKey);
        return safeParse<S>(stored, props.defaultSortBy as S);
    });
    const [sortDirection, setSortDirection] = useState<TableSortDirection>(
        () => {
            const stored = localStorage.getItem(sortDirKey);
            return safeParse<TableSortDirection>(
                stored,
                props.defaultSortDirection as TableSortDirection,
            );
        },
    );

    useEffect(() => {
        localStorage.setItem(sortByKey, JSON.stringify(sortBy));
        localStorage.setItem(sortDirKey, JSON.stringify(sortDirection));
    }, [sortBy, sortDirection, sortByKey, sortDirKey]);

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        setPage(0);
    }, [sortBy, sortDirection]);

    const sortedData = useMemo(
        () => (sortBy ? [...sorterMethod(data, sortBy, sortDirection)] : data),
        [data, sortBy, sortDirection],
    );

    const dataToShow = useMemo(() => {
        if (pageMode) {
            return sortedData.slice(
                page * rowsPerPage,
                (page + 1) * rowsPerPage,
            );
        }
        return sortedData.slice(0, slicedLimit);
    }, [sortedData, pageMode, page, rowsPerPage]);

    useEffect(() => {
        if (!isFetched) {
            setTableState(TableState.LOADING);
        } else if (dataToShow.length === 0) {
            setTableState(TableState.EMPTY);
        } else {
            setTableState(TableState.FILLED);
        }
    }, [isFetched, dataToShow]);

    const handleSort = (key: S) => {
        let nextBy: S | undefined;
        let nextDir: TableSortDirection | undefined;

        if (sortBy === key) {
            nextDir =
                sortDirection === 'desc'
                    ? 'asc'
                    : sortDirection === 'asc'
                      ? undefined
                      : 'desc';
            nextBy = nextDir ? key : undefined;
        } else {
            nextBy = key;
            nextDir = 'desc';
        }

        setSortBy(nextBy as S);
        setSortDirection(nextDir!);
    };

    const handleViewAll = (e: React.MouseEvent) => {
        e.preventDefault();
        viewAllLink && navigate(viewAllLink, { viewTransition: true });
    };
    const handleExportCsv = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('Exporting CSV');
    };

    const checkShadow = useCallback(() => {
        const body = document.getElementById(`${id}-tableBody`);
        const actions = document.getElementById(`${id}-actionsContainer`);
        if (!body || !actions) return;

        if (body.scrollTop + body.clientHeight >= body.scrollHeight) {
            actions.classList.add(styles.notShadowed);
        } else {
            actions.classList.remove(styles.notShadowed);
        }
    }, [id]);

    useEffect(() => {
        checkShadow();
        const body = document.getElementById(`${id}-tableBody`);
        if (!body) return;

        body.addEventListener('scroll', checkShadow);
        return () => {
            body.removeEventListener('scroll', checkShadow);
        };
    }, [tableState, checkShadow, id]);

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
                        id={`${id}-headerContainer`}
                        className={styles.headerContainer}
                    >
                        {renderHeader(sortDirection, handleSort, sortBy)}
                    </span>
                    <div
                        id={`${id}-tableBody`}
                        className={`${styles.tableBody} ${
                            pageMode ? styles.pageMode : styles.notPage
                        }`}
                    >
                        {tableState === TableState.FILLED &&
                            dataToShow.map(renderRow)}
                        {tableState === TableState.EMPTY && <NoDataRow />}

                        {sortedData.length > 0 && (
                            <div
                                id={`${id}-actionsContainer`}
                                className={styles.actionsContainer}
                            >
                                {!pageMode &&
                                    sortedData.length > slicedLimit &&
                                    viewAllLink && (
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
