import { useState } from 'react';
import { FiDollarSign, FiPercent } from 'react-icons/fi';
import { TbHeartFilled } from 'react-icons/tb';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './watchlist.module.css';
import WatchListNode from './watchlistnode/watchlistnode';

interface WatchListProps {}

const WatchList: React.FC<WatchListProps> = ({}) => {
    const { favCoins } = useTradeDataStore();

    const [watchListMode, setWatchListMode] = useState<'dollar' | 'percent'>(
        'dollar',
    );

    return (
        <div className={styles.watchListContainer}>
            <TbHeartFilled className={styles.favIcon} />
            <FiDollarSign
                onClick={() => setWatchListMode('dollar')}
                className={`${styles.watchListToolbarIcon} ${
                    watchListMode === 'dollar' ? styles.active : ''
                }`}
            />
            <FiPercent
                onClick={() => setWatchListMode('percent')}
                className={`${styles.watchListToolbarIcon} ${
                    styles.percentIcon
                }  ${watchListMode === 'percent' ? styles.active : ''}`}
            />

            <HorizontalScrollable className={styles.watchListLimitor}>
                <div className={styles.watchListNodesWrapper}>
                    {favCoins &&
                        favCoins.map((e) => (
                            <WatchListNode
                                key={e.coin + e.dayNtlVlm}
                                symbol={e}
                                showMode={watchListMode}
                            ></WatchListNode>
                        ))}
                </div>
            </HorizontalScrollable>
        </div>
    );
};

export default WatchList;
