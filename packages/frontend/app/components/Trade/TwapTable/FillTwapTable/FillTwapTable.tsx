import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Pagination from '~/components/Pagination/Pagination';
import NoDataRow from '~/components/Skeletons/NoDataRow';
import SkeletonTable from '~/components/Skeletons/SkeletonTable/SkeletonTable';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { TableState } from '~/utils/CommonIFs';
import type { TwapSliceFillIF } from '~/utils/UserDataIFs';
import styles from './FillTwapTable.module.css';
import FillTwapTableHeader from './FillTwapTableHeader';
import FillTwapTableRow from './FillTwapTableRow';
import type { TwapHistoryIF, UserFillSortBy } from '~/utils/UserDataIFs';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import {
    sortTwapFillHistory,
    sortTwapHistory,
} from '~/processors/processUserFills';
import { sortPositionData } from '~/utils/position/PositionUtils';

interface FillTwapTableProps {
    data: TwapSliceFillIF[];
    isFetched: boolean;
    selectedFilter?: string;
    pageMode?: boolean;
}

export default function FillTwapTable(props: FillTwapTableProps) {
    const { data, isFetched, selectedFilter, pageMode } = props;

    const navigate = useNavigate();

    const { symbol } = useTradeDataStore();

    const { debugWallet } = useDebugStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = debugWallet.address;

    const tableModeLimit = 10;

    const [tableState, setTableState] = useState<TableState>(
        TableState.LOADING,
    );

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const viewAllLink = useMemo(() => {
        return `/twapFillHistory/${currentUserRef.current}`;
    }, [debugWallet.address]);

    const handleExportCsv = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('export csv');
    };

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((twap) => twap.coin === symbol);
            case 'long':
                return data.filter((twap) => twap.side === 'buy');
            case 'short':
                return data.filter((twap) => twap.side === 'sell');
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
        <>
            <GenericTable
                data={filteredData as any}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <FillTwapTableHeader
                        sortBy={sortBy as UserFillSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                    />
                )}
                renderRow={(fill, index) => (
                    <FillTwapTableRow
                        key={`fill-${index}`}
                        fill={fill as any}
                    />
                )}
                sorterMethod={sortTwapFillHistory}
                isFetched={isFetched}
                pageMode={pageMode}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[2, 1, 1, 1, 1, 1, 1, 1]}
            />
        </>
    );
}
