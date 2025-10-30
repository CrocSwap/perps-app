import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { Link } from 'react-router';
import styles from './Ticker.module.css';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import useNumFormatter from '~/hooks/useNumFormatter';

interface CoinData {
    symbol: string;
    markPx: number;
    last24hPriceChangePercent: number;
}

// Memoized TickerItem to prevent re-renders of individual items
const TickerItem = memo(
    ({
        coin,
        formatNum,
    }: {
        coin: any;
        formatNum: (
            value: number,
            decimals?: number,
            compact?: boolean,
            isPrice?: boolean,
        ) => string;
    }) => (
        <Link
            to={`/v2/trade/${coin.symbol}`}
            className={styles.tickerItem}
            viewTransition
        >
            <span className={styles.symbol}>{coin.symbol}</span>
            <span className={styles.price}>
                {formatNum(coin.markPx, coin.markPx < 0.01 ? 3 : 2, true, true)}
            </span>
            <span
                className={
                    coin.last24hPriceChangePercent >= 0
                        ? styles.changePositive
                        : styles.changeNegative
                }
            >
                {coin.last24hPriceChangePercent >= 0 ? '+' : ''}
                {formatNum(coin.last24hPriceChangePercent, 2)}%
            </span>
        </Link>
    ),
);

// Main Ticker component
export const Ticker = memo(function Ticker() {
    const firstSetRef = useRef<HTMLDivElement | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    // Get coins from store with proper typing
    const coins = useTradeDataStore((state) => {
        // Ensure we have valid coins data
        if (!state.coins || !Array.isArray(state.coins)) return [];
        return state.coins as CoinData[];
    });

    // Memoize coins to prevent unnecessary re-renders
    const memoizedCoins = useMemo(
        () => coins,
        [
            JSON.stringify(
                coins.map((coin) => ({
                    symbol: coin.symbol,
                    markPx: coin.markPx,
                    last24hPriceChangePercent: coin.last24hPriceChangePercent,
                })),
            ),
        ],
    );

    // Memoize the formatNum function
    const { formatNum } = useNumFormatter();

    // Memoize the ticker items to prevent re-renders
    const tickerItems = useMemo(() => {
        if (!memoizedCoins || memoizedCoins.length === 0) return [];

        return Array.from({ length: 2 }).flatMap((_, setIndex) => (
            <div
                key={setIndex}
                className={styles.tickerSet}
                ref={setIndex === 0 ? firstSetRef : null}
            >
                {memoizedCoins.map((coin: CoinData) => (
                    <TickerItem
                        key={`${setIndex}-${coin.symbol}`}
                        coin={coin}
                        formatNum={formatNum}
                    />
                ))}
            </div>
        ));
    }, [memoizedCoins, formatNum]);

    // Handle animation state
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        track.style.animationPlayState = isPaused ? 'paused' : 'running';
    }, [isPaused]);

    if (!memoizedCoins || memoizedCoins.length === 0) {
        return null;
    }

    return (
        <div
            className={styles.tickerContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div ref={trackRef} className={styles.tickerTrack}>
                {tickerItems}
            </div>
        </div>
    );
});
