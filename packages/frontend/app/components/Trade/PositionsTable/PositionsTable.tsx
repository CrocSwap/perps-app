import { useMemo } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useModal } from '~/hooks/useModal';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { TableSortDirection } from '~/utils/CommonIFs';
import {
    EXTERNAL_PAGE_URL_PREFIX,
    MIN_POSITION_USD_SIZE,
} from '~/utils/Constants';
import type { PositionDataSortBy, PositionIF } from '~/utils/UserDataIFs';
import { sortPositionData } from '~/utils/position/PositionUtils';
import PositionsTableHeader from './PositionsTableHeader';
import PositionsTableRow from './PositionsTableRow';
import { useTranslation } from 'react-i18next';

interface PositionsTableProps {
    pageMode?: boolean;
    isFetched: boolean;
    selectedFilter?: string;
    onClearFilter?: () => void;
}

export default function PositionsTable(props: PositionsTableProps) {
    const { pageMode, isFetched, selectedFilter, onClearFilter } = props;
    const { coinPriceMap, symbol, symbolInfo } = useTradeDataStore();
    const { positions } = useUnifiedMarginData();
    const appSettingsModal = useModal('closed');

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
    }, [selectedFilter, dataFilteredBySize, symbol]);

    const { t, i18n } = useTranslation();

    const noDataMessage = useMemo(() => {
        switch (selectedFilter) {
            case 'active':
                return t('tradeTable.noOpenPositionsForMarket', { symbol });
            case 'long':
                return t('tradeTable.noOpenLongPositions');
            case 'short':
                return t('tradeTable.noOpenShortPositions');
            default:
                return t('tradeTable.noOpenPositions');
        }
    }, [selectedFilter, symbol, i18n.language]);

    const showClearFilter = selectedFilter && selectedFilter !== 'all';

    return (
        <>
            <GenericTable
                noDataMessage={noDataMessage}
                noDataActionLabel={
                    showClearFilter ? t('common.clearFilter') : undefined
                }
                onNoDataAction={showClearFilter ? onClearFilter : undefined}
                storageKey='PositionsTable'
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
