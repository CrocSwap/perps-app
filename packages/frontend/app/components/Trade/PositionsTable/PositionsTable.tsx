import { useMemo, useRef } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useModal } from '~/hooks/useModal';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import type { TableSortDirection } from '~/utils/CommonIFs';
import { EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type { PositionDataSortBy, PositionIF } from '~/utils/UserDataIFs';
import { sortPositionData } from '~/utils/position/PositionUtils';
import PositionsTableHeader from './PositionsTableHeader';
import PositionsTableRow from './PositionsTableRow';

interface propsIF {
    pageMode?: boolean;
    isFetched: boolean;
    selectedFilter?: string;
}

export default function PositionsTable(props: propsIF) {
    const { pageMode, isFetched, selectedFilter } = props;
    const { coinPriceMap, symbol } = useTradeDataStore();
    const { positions } = useUnifiedMarginData();
    const appSettingsModal = useModal('closed');

    const { userAddress } = useUserDataStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = userAddress;

    const viewAllLink = `${EXTERNAL_PAGE_URL_PREFIX}/positions`;

    const filteredData = useMemo(() => {
        switch (selectedFilter) {
            case 'all':
                return positions;
            case 'active':
                return positions.filter((fill) => fill.coin === symbol);
            case 'long':
                return positions.filter((fill) => fill.szi > 0);
            case 'short':
                return positions.filter((fill) => fill.szi < 0);
        }

        return positions;
    }, [positions, selectedFilter]);
    return (
        <>
            <GenericTable
                noDataMessage='No open positions'
                storageKey={`PositionsTable_${currentUserRef.current}`}
                data={filteredData as PositionIF[]}
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
