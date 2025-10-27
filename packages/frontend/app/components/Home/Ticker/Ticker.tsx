import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './Ticker.module.css';
import { MOCK_TICKER_DATA } from '../config/ticker-data';

export function Ticker() {
    const firstSetRef = useRef<HTMLDivElement | null>(null);
    const [loopWidth, setLoopWidth] = useState<number | null>(null);

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

    return (
        <div className={styles.tickerContainer}>
            <div className={styles.tickerTrack} style={trackStyle}>
                {Array.from({ length: 2 }).map((_, setIndex) => (
                    <div
                        key={setIndex}
                        className={styles.tickerSet}
                        ref={setIndex === 0 ? firstSetRef : null}
                    >
                        {MOCK_TICKER_DATA.map((crypto, index) => (
                            <a
                                key={`${setIndex}-${index}`}
                                href={crypto.href}
                                target='_blank'
                                rel='noreferrer'
                                className={styles.tickerItem}
                            >
                                <span className={styles.symbol}>
                                    {crypto.symbol}
                                </span>
                                <span className={styles.price}>
                                    ${crypto.price.toLocaleString()}
                                </span>
                                <span
                                    className={
                                        crypto.change >= 0
                                            ? styles.changePositive
                                            : styles.changeNegative
                                    }
                                >
                                    {crypto.change >= 0 ? '+' : ''}
                                    {crypto.change.toFixed(2)}%
                                </span>
                            </a>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
