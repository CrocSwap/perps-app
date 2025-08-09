import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useModal } from '~/hooks/useModal';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import type { TableSortDirection } from '~/utils/CommonIFs';
import {
    EXTERNAL_PAGE_URL_PREFIX,
    MIN_POSITION_USD_SIZE,
} from '~/utils/Constants';
import type { PositionDataSortBy, PositionIF } from '~/utils/UserDataIFs';
import { sortPositionData } from '~/utils/position/PositionUtils';
import PositionsTableHeader from './PositionsTableHeader';
import PositionsTableRow from './PositionsTableRow';

interface PositionsTableProps {
    pageMode?: boolean;
    isFetched: boolean;
    selectedFilter?: string;
}

export default function PositionsTable(props: PositionsTableProps) {
    const { pageMode, isFetched, selectedFilter } = props;
    const { coinPriceMap, symbol, symbolInfo } = useTradeDataStore();
    const { positions } = useUnifiedMarginData();
    const appSettingsModal = useModal('closed');

    const { userAddress } = useUserDataStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = userAddress;

    const viewAllLink = `${EXTERNAL_PAGE_URL_PREFIX}/positions`;

    const dataFilteredBySize = useMemo(() => {
        return positions.filter(
            (position) =>
                Math.abs(position.szi) *
                    (symbolInfo?.markPx || position.entryPx) >
                MIN_POSITION_USD_SIZE,
        );
    }, [positions, symbolInfo]);

    const dataFilteredByType = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return dataFilteredBySize;
            case 'active':
                return dataFilteredBySize.filter(
                    (fill) => fill.coin === symbol,
                );
            case 'long':
                return dataFilteredBySize.filter((fill) => fill.szi > 0);
            case 'short':
                return dataFilteredBySize.filter((fill) => fill.szi < 0);
        }

        return dataFilteredBySize;
    }, [selectedFilter, dataFilteredBySize]);
    return (
        <>
            <GenericTable
                noDataMessage='No open positions'
                storageKey={`PositionsTable_${currentUserRef.current}`}
                data={dataFilteredByType as PositionIF[]}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <>
                        <PositionsTableHeader
                            sortBy={sortBy as PositionDataSortBy}
                            sortDirection={sortDirection}
                            sortClickHandler={sortClickHandler}
                        />
                    </>
                )}
                renderRow={(position, index) => (
                    <PositionsTableRow
                        key={`position-${index}`}
                        position={position as unknown as PositionIF}
                        openTPModal={() => appSettingsModal.open()}
                        closeTPModal={appSettingsModal.close}
                    />
                )}
                sorterMethod={(
                    positions: PositionIF[],
                    sortBy: PositionDataSortBy,
                    sortDirection: TableSortDirection,
                    // _ignoredMap?: Record<string, number>, // TODO: commented out for lint
                ) =>
                    sortPositionData(
                        positions,
                        sortBy,
                        sortDirection,
                        coinPriceMap,
                    )
                }
                isFetched={isFetched}
                pageMode={pageMode}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[2, 1, 1, 1, 1, 1, 1, 1]}
            />
        </>
    );
}
