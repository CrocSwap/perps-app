import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Pagination from '~/components/Pagination/Pagination';
import NoDataRow from '~/components/Skeletons/NoDataRow';
import SkeletonTable from '~/components/Skeletons/SkeletonTable/SkeletonTable';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import type { TwapHistoryIF } from '~/utils/UserDataIFs';
import styles from './HistoryTwapTable.module.css';
import HistoryTwapTableHeader from './HistoryTwapTableHeader';
import HistoryTwapTableRow from './HistoryTwapTableRow';
interface HistoryTwapTableProps {
    data: TwapHistoryIF[];
    isFetched: boolean;
    selectedFilter?: string;
    pageMode?: boolean;
}

export default function HistoryTwapTable(props: HistoryTwapTableProps) {
    const { data, isFetched, selectedFilter, pageMode } = props;

    const navigate = useNavigate();

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const { symbol } = useTradeDataStore();

    const tableModeLimit = 10;

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const handleViewAll = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(`/twapHistory/${currentUserRef.current}`, {
            viewTransition: true,
        });
    };

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((twap) => twap.state.coin === symbol);
            case 'long':
                return data.filter((twap) => twap.state.side === 'buy');
            case 'short':
                return data.filter((twap) => twap.state.side === 'sell');
        }
        return data;
    }, [data, selectedFilter, symbol]);

    const sortedData = useMemo(() => {
        return filteredData;
    }, [filteredData]);

    const dataToShow = useMemo(() => {
        if (pageMode) {
            return sortedData.slice(
                page * rowsPerPage,
                (page + 1) * rowsPerPage,
            );
        }
        return sortedData.slice(0, tableModeLimit);
    }, [sortedData, pageMode, page, rowsPerPage]);

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
    }, [isFetched, dataToShow]);

    return (
        <div className={styles.tableWrapper}>
            {tableState === TableState.LOADING ? (
                <SkeletonTable
                    rows={7}
                    colRatios={[2, 1, 1.5, 1.5, 1.5, 1.5, 1, 1, 1]}
                />
            ) : (
                <>
                    <HistoryTwapTableHeader />
                    <div className={styles.tableBody}>
                        {tableState === TableState.FILLED && (
                            <>
                                {dataToShow.map((twap, index) => (
                                    <HistoryTwapTableRow
                                        key={`twap-${index}`}
                                        twap={twap}
                                    />
                                ))}
                            </>
                        )}
                        {tableState === TableState.EMPTY && <NoDataRow />}
                    </div>

                    {filteredData.length > tableModeLimit && !pageMode && (
                        <div
                            className={styles.viewAllLink}
                            onClick={handleViewAll}
                        >
                            View All
                        </div>
                    )}

                    {pageMode && (
                        <Pagination
                            totalCount={filteredData.length}
                            onPageChange={setPage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={setRowsPerPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
