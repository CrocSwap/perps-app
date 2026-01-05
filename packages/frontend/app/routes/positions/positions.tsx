import { useMemo } from 'react';
import PositionsTable from '~/components/Trade/PositionsTable/PositionsTable';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { WsChannels } from '~/utils/Constants';
import WebDataConsumer from '../trade/webdataconsumer';
import styles from './positions.module.css';
export function meta() {
    return [
        { title: 'Positions | Ambient Finance' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

function Positions() {
    const isFullScreen = true;

    // Memoize the container class name
    const containerClassName = useMemo(() => {
        return `${styles.container} ${isFullScreen ? styles.fullScreen : ''}`;
    }, [isFullScreen]);

    const { fetchedChannels } = useTradeDataStore();

    const isFetched = fetchedChannels.has(WsChannels.USER_FILLS);

    return (
        <div className={containerClassName}>
            <WebDataConsumer />
            <header>Positions</header>

            <div className={styles.content}>
                <PositionsTable
                    pageMode={true}
                    isFetched={isFetched}
                    selectedFilter='all'
                />
            </div>
        </div>
    );
}
export default Positions;
