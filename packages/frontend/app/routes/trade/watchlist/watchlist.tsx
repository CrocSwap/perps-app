import { useState } from 'react';
import { FiDollarSign, FiPercent } from 'react-icons/fi';
import { TbHeart, TbHeartFilled } from 'react-icons/tb';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './watchlist.module.css';
import WatchListNode from './watchlistnode/watchlistnode';

const WatchList: React.FC = () => {
    const { favCoins, favKeys, symbol, addToFavKeys, removeFromFavKeys } =
        useTradeDataStore();

    const clickableCoins = new Set(['BTC']); // Only BTC is clickable

    const [watchListMode, setWatchListMode] = useState<'dollar' | 'percent'>(
        'dollar',
    );

    const handleFavClick = (event: React.MouseEvent<SVGSVGElement>) => {
        event.stopPropagation();

        if (favKeys.includes(symbol)) {
            removeFromFavKeys(symbol);
        } else {
            addToFavKeys(symbol);
        }
    };

    return (
        <div className={styles.watchListContainer}>
            <div
                id='watchlist-static-area'
                className={styles.watchlistStaticArea}
            >
                {/* show filled heart when active market is favorited */}
                {favKeys.includes(symbol) ? (
                    <TbHeartFilled
                        className={styles.favIcon}
                        size={23}
                        onClick={handleFavClick}
                    />
                ) : (
                    <TbHeart
                        className={styles.favIcon}
                        size={23}
                        onClick={handleFavClick}
                    />
                )}
                <FiDollarSign
                    onClick={() => setWatchListMode('dollar')}
                    className={`${styles.watchListToolbarIcon} ${watchListMode === 'dollar' ? styles.active : ''}`}
                />
                <FiPercent
                    onClick={() => setWatchListMode('percent')}
                    className={`${styles.watchListToolbarIcon} ${styles.percentIcon}  ${watchListMode === 'percent' ? styles.active : ''}`}
                />
            </div>

            <HorizontalScrollable
                excludes={['watchlist-static-area']}
                wrapperId='trade-page-left-section'
                offset={20}
            >
                <div className={styles.watchListNodesWrapper}>
                    {favCoins &&
                        favCoins.map((e) => (
                            <WatchListNode
                                key={e.coin}
                                coin={e.coin}
                                markPx={e.markPx}
                                prevDayPx={e.prevDayPx}
                                isActive={false}
                                showMode={watchListMode}
                                disabled={!clickableCoins.has(e.coin)}
                            />
                        ))}
                </div>
            </HorizontalScrollable>
        </div>
    );
};

export default WatchList;
