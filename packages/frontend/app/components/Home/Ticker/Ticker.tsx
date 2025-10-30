import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import styles from './Ticker.module.css';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import useNumFormatter from '~/hooks/useNumFormatter';

export function Ticker() {
    const firstSetRef = useRef<HTMLDivElement | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const { coins } = useTradeDataStore();

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        if (isPaused) {
            track.style.animationPlayState = 'paused';
        } else {
            track.style.animationPlayState = 'running';
        }
    }, [isPaused]);

    const { formatNum } = useNumFormatter();

    if (!coins || coins.length === 0) {
        return null;
    }

    return (
        <div
            className={styles.tickerContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div ref={trackRef} className={styles.tickerTrack}>
                {Array.from({ length: 2 }).map((_, setIndex) => (
                    <div
                        key={setIndex}
                        className={styles.tickerSet}
                        ref={setIndex === 0 ? firstSetRef : null}
                    >
                        {coins.map((coin, index) => (
                            <Link
                                key={`${setIndex}-${index}`}
                                to={`/v2/trade/${coin.symbol}`}
                                className={styles.tickerItem}
                            >
                                <span className={styles.symbol}>
                                    {coin.symbol}
                                </span>
                                <span className={styles.price}>
                                    {formatNum(
                                        coin.markPx,
                                        coin.markPx < 0.01 ? 3 : 2,
                                        true,
                                        true,
                                    )}
                                </span>
                                <span
                                    className={
                                        coin.last24hPriceChangePercent >= 0
                                            ? styles.changePositive
                                            : styles.changeNegative
                                    }
                                >
                                    {coin.last24hPriceChangePercent >= 0
                                        ? '+'
                                        : ''}
                                    {formatNum(
                                        coin.last24hPriceChangePercent,
                                        2,
                                    )}
                                    %
                                </span>
                            </Link>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
