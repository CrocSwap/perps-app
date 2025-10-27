import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './Ticker.module.css';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import useNumFormatter from '~/hooks/useNumFormatter';

export function Ticker() {
    const firstSetRef = useRef<HTMLDivElement | null>(null);
    const [loopWidth, setLoopWidth] = useState<number | null>(null);

    const { coins } = useTradeDataStore();

    const { formatNum } = useNumFormatter();

    useEffect(() => {
        const element = firstSetRef.current;
        if (!element) {
            return;
        }

        const updateWidth = () => {
            setLoopWidth(element.offsetWidth);
        };

        updateWidth();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(updateWidth);
            observer.observe(element);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    let trackStyle: CSSProperties | undefined;
    if (loopWidth && loopWidth > 0) {
        const SPEED_PX_PER_SECOND = 60;
        const durationSeconds = Math.max(loopWidth / SPEED_PX_PER_SECOND, 12);
        trackStyle = {
            '--loop-offset': `-${loopWidth}px`,
            '--loop-duration': `${durationSeconds}s`,
        } as CSSProperties;
    }

    if (!coins || coins.length === 0) {
        return null;
    }

    return (
        <div className={styles.tickerContainer}>
            <div className={styles.tickerTrack} style={trackStyle}>
                {Array.from({ length: 2 }).map((_, setIndex) => (
                    <div
                        key={setIndex}
                        className={styles.tickerSet}
                        ref={setIndex === 0 ? firstSetRef : null}
                    >
                        {coins.map((coin, index) => (
                            <div
                                key={`${setIndex}-${index}`}
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
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
