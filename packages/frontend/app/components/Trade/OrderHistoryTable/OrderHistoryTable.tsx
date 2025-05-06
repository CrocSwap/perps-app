import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Pagination from '~/components/Pagination/Pagination';
import NoDataRow from '~/components/Skeletons/NoDataRow';
import SkeletonTable from '~/components/Skeletons/SkeletonTable/SkeletonTable';
import { useSdk } from '~/hooks/useSdk';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState, type TableSortDirection } from '~/utils/CommonIFs';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import styles from './OrderHistoryTable.module.css';
import OrderHistoryTableHeader from './OrderHistoryTableHeader';
import OrderHistoryTableRow from './OrderHistoryTableRow';

interface OrderHistoryTableProps {
    selectedFilter?: string;
    pageMode?: boolean;
    data: OrderDataIF[];
    isFetched: boolean;
}

export default function OrderHistoryTable(props: OrderHistoryTableProps) {
    const { selectedFilter, pageMode, data, isFetched } = props;

    const navigate = useNavigate();

    const tableModeLimit = 10;

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const [sortDirection, setSortDirection] = useState<TableSortDirection>();
    const [sortBy, setSortBy] = useState<OrderDataSortBy>();

    const { info } = useSdk();
    const { symbol, filterOrderHistory } = useTradeDataStore();

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const { isWsEnabled } = useDebugStore();
    const isWsEnabledRef = useRef<boolean>(true);
    isWsEnabledRef.current = isWsEnabled;

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );
    useEffect(() => {
        if (isFetched) {
            if (data.length > 0) {
                setTableState(TableState.FILLED);
            } else {
                setTableState(TableState.EMPTY);
            }
        } else {
            setTableState(TableState.LOADING);
        }
    }, [data, isFetched]);

    const filteredOrderHistory = useMemo(() => {
        return filterOrderHistory(data, selectedFilter);
    }, [data, selectedFilter, symbol]);

    const sortedOrderHistory = useMemo(() => {
        return sortOrderData(filteredOrderHistory, sortBy, sortDirection);
    }, [filteredOrderHistory, sortBy, sortDirection]);

    const orderHistoryToShow = useMemo(() => {
        if (pageMode) {
            return sortedOrderHistory.slice(
                page * rowsPerPage,
                (page + 1) * rowsPerPage,
            );
        }
        // TODO page logic will be implemented for external page
        return sortedOrderHistory.slice(0, 10);
    }, [sortedOrderHistory, pageMode, page, rowsPerPage]);

    useEffect(() => {
        if (!info) return;
        if (!debugWallet.address) return;
    }, [debugWallet.address, info]);

    const handleSort = (key: string) => {
        if (sortBy === key) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else if (sortDirection === 'asc') {
                setSortDirection(undefined);
                setSortBy(undefined);
            } else {
                setSortDirection('desc');
            }
        } else {
            setSortBy(key as OrderDataSortBy);
            setSortDirection('desc');
        }
    };

    const handleViewAll = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(`/orderHistory/${currentUserRef.current}`);
    };

    return (
        <div className={styles.tableWrapper}>
            {tableState === TableState.LOADING ? (
                <SkeletonTable
                    rows={7}
                    colRatios={[1, 2, 2, 1, 1, 2, 1, 1, 2, 3, 1]}
                />
            ) : (
                <>
                    <OrderHistoryTableHeader
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={handleSort}
                    />
                    <div className={styles.tableBody}>
                        {tableState === TableState.FILLED && (
                            <>
                                {orderHistoryToShow.map((order, index) => (
                                    <OrderHistoryTableRow
                                        key={`order-${index}`}
                                        order={order}
                                    />
                                ))}
                                {data.length > tableModeLimit && !pageMode && (
                                    <a
                                        href='#'
                                        className={styles.viewAllLink}
                                        onClick={handleViewAll}
                                    >
                                        View All
                                    </a>
                                )}
                                {pageMode && (
                                    <>
                                        <Pagination
                                            totalCount={data.length}
                                            onPageChange={setPage}
                                            rowsPerPage={rowsPerPage}
                                            onRowsPerPageChange={setRowsPerPage}
                                        />
                                    </>
                                )}
                            </>
                        )}

                        {tableState === TableState.EMPTY && <NoDataRow />}
                    </div>
                </>
            )}
        </div>
    );
}
