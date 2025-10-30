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

    // Create a safe array of coins with proper type checking
    const memoizedCoins = useMemo(() => {
        if (!coins || coins.length === 0) return [];

        // Take top 5 coins
        const top5Coins = coins.slice(0, 5);
        // If we have fewer than 5 coins, just return the coins as is
        if (top5Coins.length < 5) return [...coins];

        // concatenate copies of  coins until we have 500 coins
        const coinsLength = coins.length;
        const numCopies = Math.floor(1500 / coinsLength);
        const coinsArray = coins.concat(
            ...Array.from({ length: numCopies - 1 }, () => coins),
        );
        // Create a new array where every 3rd element is from top5Coins
        return coinsArray
            .map((coin, index) => {
                if (index % 3 === 0) {
                    // Use modulo to safely cycle through top5Coins
                    return top5Coins[index % top5Coins.length] || coin;
                }
                return coin;
            })
            .filter(Boolean); // Remove any potential undefined values
    }, [
        JSON.stringify(
            coins.map((coin) => ({
                symbol: coin.symbol,
                markPx: coin.markPx,
                last24hPriceChangePercent: coin.last24hPriceChangePercent,
            })),
        ),
    ]);

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
                {memoizedCoins.map((coin: CoinData, coinIndex) => (
                    <TickerItem
                        key={`${setIndex}-${coin.symbol}-${coinIndex}`}
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
