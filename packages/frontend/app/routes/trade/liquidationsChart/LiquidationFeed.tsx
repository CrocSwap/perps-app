import { useCallback, useEffect, useRef } from 'react';
import { useWs } from '~/contexts/WsContext';
import useNumFormatter from '~/hooks/useNumFormatter';
import {
    useLiquidationFeedStore,
    type LiquidationFeedMessage,
} from '~/stores/LiquidationFeedStore';
import styles from './LiquidationFeed.module.css';

const LiquidationFeed: React.FC = () => {
    const { subscribe, unsubscribe } = useWs();
    const { events, addEvents } = useLiquidationFeedStore();
    const { formatNum } = useNumFormatter();
    const listRef = useRef<HTMLDivElement>(null);

    const handleLiquidations = useCallback(
        (data: LiquidationFeedMessage) => {
            if (data.events && data.events.length > 0) {
                addEvents(data.events);
            }
        },
        [addEvents],
    );

    useEffect(() => {
        const config = {
            handler: handleLiquidations,
            payload: { marketId: 64 },
        };

        subscribe('liquidations', config);

        return () => {
            unsubscribe('liquidations', config);
        };
    }, [subscribe, unsubscribe, handleLiquidations]);

    const formatTime = (eventTime: number): string => {
        const date = new Date(eventTime);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const truncateAddress = (address: string): string => {
        if (address.length <= 8) return address;
        return `${address.slice(0, 4)}..${address.slice(-4)}`;
    };

    const formatPrice = (rawPrice: number | null | undefined): string => {
        if (rawPrice == null) return '-';
        return formatNum(rawPrice / 1e6, 2);
    };

    const formatQty = (rawQty: number | null | undefined): string => {
        if (rawQty == null) return '-';
        return formatNum(rawQty / 1e8, 4, false, false, false, true);
    };

    const getSideLabel = (side: number): string => {
        return side === 1 ? 'Long' : 'Short';
    };

    const getSideClass = (side: number): string => {
        return side === 1 ? styles.long : styles.short;
    };

    if (events.length === 0) {
        return (
            <div className={styles.feedContainer}>
                <div className={styles.emptyState}>
                    Waiting for liquidations...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.feedContainer}>
            <div className={styles.feedHeader}>
                <span>Time</span>
                <span>Side</span>
                <span>Price</span>
                <span>Size</span>
                <span>Account</span>
            </div>
            <div className={styles.feedList} ref={listRef}>
                {events.map((event, index) => (
                    <div
                        key={`${event.order_id}-${event.event_time}`}
                        className={`${styles.feedRow} ${index === 0 ? styles.newRow : ''}`}
                    >
                        <span className={styles.time}>
                            {formatTime(event.event_time)}
                        </span>
                        <span className={getSideClass(event.side)}>
                            {getSideLabel(event.side)}
                        </span>
                        <span className={styles.price}>
                            {formatPrice(event.fill_price)}
                        </span>
                        <span className={styles.size}>
                            {formatQty(event.fill_qty)}
                        </span>
                        <span className={styles.user}>
                            {truncateAddress(event.user_pubkey)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LiquidationFeed;
