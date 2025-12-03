import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
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
import { useIsClient } from '~/hooks/useIsClient';
import { useDebugStore } from '~/stores/DebugStore';
import {
    TableState,
    type HeaderCell,
    type TableSortDirection,
} from '~/utils/CommonIFs';
import styles from './GenericTable.module.css';

interface GenericTableProps<
    T,
    S,
    F extends (...args: Parameters<F>) => Promise<T[]>,
> {
    data: T[];
    noDataMessage?: string;
    noDataActionLabel?: string;
    onNoDataAction?: () => void;
    renderHeader: (
        sortDirection: TableSortDirection,
        sortClickHandler: (key: S) => void,
        sortBy?: S,
    ) => React.ReactNode;
    renderRow: (row: T, index: number) => React.ReactNode;
    sorterMethod?: (
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
    tableModel?: HeaderCell[];
    csvDataFetcher?: (...args: Parameters<F>) => Promise<T[]>;
    csvDataFetcherArgs?: Parameters<F>;
}

export default function GenericTable<
    T,
    S,
    F extends (...args: Parameters<F>) => Promise<T[]>,
>(props: GenericTableProps<T, S, F>) {
    const id = useId();
    const navigate = useNavigate();

    const sessionState = useSession();

    const sessionButtonRef = useRef<HTMLDivElement>(null);
    const {
        data,
        noDataMessage,
        noDataActionLabel,
        onNoDataAction,
        renderHeader,
        renderRow,
        sorterMethod,
        isFetched,
        pageMode,
        skeletonRows = 7,
        skeletonColRatios = [2, 1, 1.5, 1.5, 1.5, 1.5, 1, 1, 1],
        slicedLimit = 10,
        viewAllLink,
        storageKey,
        // defaultSortBy,
        // defaultSortDirection,
        heightOverride = '100%',
        tableModel,
        csvDataFetcher,
        csvDataFetcherArgs,
    } = props;

    function safeParse<T>(value: string | null, fallback: T): T {
        if (!value || value === 'undefined') return fallback;
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    const sortByKey = `GenericTable:${storageKey}:sortBy`;
    const sortDirKey = `GenericTable:${storageKey}:sortDir`;

    const [sortBy, setSortBy] = useState<S>(props.defaultSortBy as S);

    const { manualAddressEnabled, manualAddress, isDebugWalletActive } =
        useDebugStore();

    const [sortDirection, setSortDirection] = useState<TableSortDirection>(
        props.defaultSortDirection as TableSortDirection,
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedSortBy = window.localStorage.getItem(sortByKey);
        const storedSortDir = window.localStorage.getItem(sortDirKey);

        if (storedSortBy) {
            setSortBy(safeParse<S>(storedSortBy, props.defaultSortBy as S));
        }
        if (storedSortDir) {
            setSortDirection(
                safeParse<TableSortDirection>(
                    storedSortDir,
                    props.defaultSortDirection as TableSortDirection,
                ),
            );
        }
    }, [sortDirKey, sortByKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (sortBy !== undefined) {
            window.localStorage.setItem(sortByKey, JSON.stringify(sortBy));
        }
        if (sortDirection !== undefined) {
            window.localStorage.setItem(
                sortDirKey,
                JSON.stringify(sortDirection),
            );
        }
    }, [sortBy, sortDirection, sortByKey, sortDirKey]);

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const isClient = useIsClient();

    const [rowLimit, setRowLimit] = useState(slicedLimit);

    const isHttpInfoCallsDisabled = true;
    const isSessionEstablished = useMemo(() => {
        if (manualAddressEnabled) {
            return manualAddress && manualAddress.length > 0;
        }
        if (isDebugWalletActive) {
            return true;
        }
        return isEstablished(sessionState);
    }, [
        sessionState,
        manualAddressEnabled,
        manualAddress,
        isDebugWalletActive,
    ]);
    const isShowAllEnabled = isSessionEstablished && data.length > slicedLimit;

    const checkShadow = useCallback(() => {
        const tableBody = document.getElementById(`${id}-tableBody`);
        if (!tableBody) return;

        const hasOverflow = tableBody.scrollHeight > tableBody.clientHeight + 1;
        const atBottom =
            tableBody.scrollTop + tableBody.clientHeight + 1 >=
            tableBody.scrollHeight;

        // Toggle classes directly on tableBody
        tableBody.classList.toggle(styles.hasOverflow, hasOverflow);
        tableBody.classList.toggle(styles.atBottom, atBottom);
    }, [id]);

    const calculateRowCount = () => {
        const rowHeight = 25;
        const tableBody = document.getElementById(
            `${id}-tableBody`,
        ) as HTMLElement;

        if (!tableBody) {
            return;
        }

        const rowCount = Math.floor(tableBody.clientHeight / rowHeight);

        if (isShowAllEnabled) {
            setRowLimit(Infinity);
        } else if (rowCount > slicedLimit) {
            setRowLimit(rowCount);
        } else {
            setRowLimit(slicedLimit);
        }
    };

    useEffect(() => {
        checkShadow();
        calculateRowCount();

        const tableBody = document.getElementById(
            `${id}-tableBody`,
        ) as HTMLElement;

        const scrollHandler = () => {
            checkShadow();
        };

        if (tableBody) {
            tableBody.addEventListener('scroll', scrollHandler);
        }

        return () => {
            if (tableBody) {
                tableBody.removeEventListener('scroll', scrollHandler);
            }
        };
    }, [tableState, checkShadow, id]);

    useEffect(() => {
        if (!isClient) {
            return;
        }
        const resizeEvent = () => {
            checkShadow();
            calculateRowCount();
        };
        window.addEventListener('resize', resizeEvent);

        return () => {
            if (isClient) {
                window.removeEventListener('resize', resizeEvent);
            }
        };
    }, [isClient]);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        setPage(0);
    }, [sortBy, sortDirection]);

    const sortedData = useMemo(() => {
        if (sortBy && sorterMethod) {
            return [...sorterMethod(data, sortBy, sortDirection)];
        }
        return data;
    }, [data, sortBy, sortDirection, sorterMethod]);

    const dataToShow = useMemo(() => {
        if (pageMode) {
            return sortedData.slice(
                page * rowsPerPage,
                (page + 1) * rowsPerPage,
            );
        }
        // Do not mutate the DOM during render; effects will handle shadows
        return sortedData.slice(0, rowLimit);
    }, [sortedData, pageMode, page, rowsPerPage, rowLimit]);

    useEffect(() => {
        if (!isFetched) {
            setTableState(TableState.LOADING);
        } else if (dataToShow.length === 0) {
            setTableState(TableState.EMPTY);
        } else {
            setTableState(TableState.FILLED);
        }
    }, [isFetched, dataToShow, storageKey]);

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
        if (viewAllLink) {
            navigate(viewAllLink, { viewTransition: true });
        }
    };

    function formatCsvCell(val: any): string {
        if (val == null) {
            return '--';
        }

        if (typeof val === 'number' && isFinite(val)) {
            return val.toFixed(2);
        }

        if (typeof val === 'string') {
            const trimmed = val.trim();

            if (/^[\$£€¥]/.test(trimmed)) {
                return `="${trimmed}"`;
            }

            if (
                trimmed !== '' &&
                !isNaN(Number(trimmed)) &&
                isFinite(Number(trimmed))
            ) {
                return Number(trimmed).toFixed(2);
            }

            if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(trimmed)) {
                return `="${trimmed}"`;
            }

            return trimmed;
        }

        return String(val);
    }

    const handleExportCsv = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!tableModel) return;

        let dataToExport = data;
        if (!pageMode && csvDataFetcher) {
            dataToExport = await csvDataFetcher(
                ...(csvDataFetcherArgs as Parameters<typeof csvDataFetcher>),
            );
        }

        const headers = tableModel.filter((h) => h.exportable);
        const delimiter = ';';

        const csvRows = [
            headers.map((h) => h.name).join(delimiter),

            ...dataToExport.map((row: any) =>
                headers
                    .map((h) => {
                        const raw = row[h.key];

                        if (h.exportAction) {
                            return h.exportAction(raw);
                        }

                        return formatCsvCell(raw);
                    })
                    .map((cell) =>
                        /[;"\r\n]/.test(cell)
                            ? `"${cell.replace(/"/g, '""')}"`
                            : cell,
                    )
                    .join(delimiter),
            ),
        ];

        const blob = new Blob([csvRows.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${storageKey}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        checkShadow();
        const body = document.getElementById(`${id}-tableBody`);
        if (!body) return;

        body.addEventListener('scroll', checkShadow);
        return () => {
            body.removeEventListener('scroll', checkShadow);
        };
    }, [tableState, checkShadow, id]);

    useEffect(() => {
        const button = sessionButtonRef.current;
        if (button) {
            const handleClick = () => {
                localStorage.setItem(
                    'loginButtonClickTime',
                    Date.now().toString(),
                );
            };
            button.addEventListener('click', handleClick);
            return () => button.removeEventListener('click', handleClick);
        }
    }, []);

    return (
        <div
            className={`${styles.tableWrapper} ${
                isShowAllEnabled ? styles.showAllWrapper : ''
            }`}
            style={{
                height: heightOverride,
            }}
        >
            <div
                id={`${id}-tableBody`}
                className={`${styles.tableBody} ${
                    pageMode ? styles.pageMode : styles.notPage
                } ${isShowAllEnabled ? styles.scrollVisible : ''}`}
                style={{
                    overflowY: isSessionEstablished ? 'auto' : 'hidden',
                }}
            >
                <span
                    id={`${id}-headerContainer`}
                    className={styles.headerContainer}
                >
                    {tableState === TableState.LOADING ? (
                        <div /> // for header during loading
                    ) : (
                        renderHeader(sortDirection, handleSort, sortBy)
                    )}
                </span>
                {isSessionEstablished && tableState === TableState.LOADING && (
                    <SkeletonTable
                        rows={skeletonRows}
                        colRatios={skeletonColRatios}
                    />
                )}
                {isSessionEstablished &&
                    tableState === TableState.FILLED &&
                    dataToShow.map(renderRow)}
                {isSessionEstablished && tableState === TableState.EMPTY && (
                    <NoDataRow
                        text={noDataMessage}
                        actionLabel={noDataActionLabel}
                        onAction={onNoDataAction}
                    />
                )}
                {!isSessionEstablished && (
                    <div
                        className={`plausible-event-name=Login+Button+Click plausible-event-buttonLocation=Generic+Table ${styles.sessionButtonContainer}`}
                        ref={sessionButtonRef}
                    >
                        <SessionButton />
                    </div>
                )}

                {!isHttpInfoCallsDisabled && sortedData.length > 0 && (
                    <div
                        id={`${id}-actionsContainer`}
                        className={styles.actionsContainer}
                    >
                        {sortedData.length > slicedLimit &&
                            !pageMode &&
                            viewAllLink &&
                            viewAllLink.length > 0 && (
                                <a
                                    href='#'
                                    className={styles.viewAllLink}
                                    onClick={handleViewAll}
                                >
                                    View All
                                </a>
                            )}
                        {tableModel &&
                            (pageMode || csvDataFetcher) &&
                            tableModel.some((header) => header.exportable) && (
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

                {isHttpInfoCallsDisabled && (
                    <div
                        id={`${id}-actionsContainer`}
                        className={
                            styles.actionsContainer + ' ' + styles.showAllMode
                        }
                    ></div>
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
        </div>
    );
}
