import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Pagination from '~/components/Pagination/Pagination';
import SkeletonTable from '~/components/Skeletons/SkeletonTable/SkeletonTable';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import styles from './PositionsTable.module.css';
import PositionsTableHeader from './PositionsTableHeader';
import PositionsTableRow from './PositionsTableRow';
import NoDataRow from '~/components/Skeletons/NoDataRow';
import { WsChannels } from '~/utils/Constants';

interface PositionsTableProps {
    pageMode?: boolean;
}
import { useMemo, useState } from 'react';
import type { TableSortDirection } from '~/utils/CommonIFs';
import type { PositionDataSortBy } from '~/utils/position/PositionIFs';
import { sortPositionData } from '~/utils/position/positionUtils';



export default function PositionsTable(props: PositionsTableProps) {
    const { pageMode } = props;
    const navigate = useNavigate();

    const handleViewAll = () => {
        navigate(`/positions`);
    };

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const { positions, fetchedChannels } = useTradeDataStore();
    const limit = 10;

    const webDataFetched = useMemo(() => {
        return fetchedChannels.has(WsChannels.WEB_DATA2);
    }, [fetchedChannels]);

    const positionsToShow = useMemo(() => {
        if (pageMode) {
            return positions.slice(
                page * rowsPerPage,
                (page + 1) * rowsPerPage,
            );
        }
        return positions.slice(0, limit);
    }, [positions, page, rowsPerPage, pageMode]);

    useEffect(() => {
        if (webDataFetched) {
            if (positionsToShow.length > 0) {
                setTableState(TableState.FILLED);
            } else {
                setTableState(TableState.EMPTY);
            }
        } else {
            setTableState(TableState.LOADING);
        }
    }, [positionsToShow, webDataFetched]);
    const [sortDirection, setSortDirection] = useState<TableSortDirection>();
    const [sortBy, setSortBy] = useState<PositionDataSortBy>();

     const sortedPositions = useMemo(() => {
            return sortPositionData(positions, sortBy, sortDirection);
        }, [positions, sortBy, sortDirection]);

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
                    setSortBy(key as PositionDataSortBy);
                    setSortDirection('desc');
                }
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
                    <PositionsTableHeader />
                    <div className={styles.tableBody}>
                        {tableState === TableState.FILLED && (
                            <>
                                {positionsToShow.map((position, index) => (
                                    <PositionsTableRow
                                        key={`position-${index}`}
                                        position={position}
                                    />
                                ))}
                                {positions.length > limit && !pageMode && (
                                    <a
                                        href='#'
                                        className={styles.viewAllLink}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleViewAll();
                                        }}
                                    >
                                        View All
                                    </a>
                                )}

                                {pageMode && (
                                    <>
                                        <Pagination
                                            totalCount={positions.length}
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
