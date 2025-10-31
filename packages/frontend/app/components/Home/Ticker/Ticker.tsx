import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { Link } from 'react-router';
import styles from './Ticker.module.css';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';

interface CoinData {
    symbol: string;
    markPx: number;
    last24hPriceChangePercent: number;
}

// Memoized TickerItem to prevent re-renders of individual items
interface TickerItemProps {
    coin: any;
    formatNum: (
        value: number,
        decimals?: number,
        compact?: boolean,
        isPrice?: boolean,
    ) => string;
    priceChangeState: 'up' | 'down' | null;
}

const TickerItem = memo(function TickerItem({
    coin,
    formatNum,
    priceChangeState,
}: TickerItemProps) {
    const { getBsColor } = useAppSettings();
    const buyColor = getBsColor().buy;
    const sellColor = getBsColor().sell;

    const getFlashStyle = () => {
        if (priceChangeState === 'up') {
            return {
                '--buy-color': buyColor,
                '--flash-color': buyColor,
            } as React.CSSProperties;
        } else if (priceChangeState === 'down') {
            return {
                '--sell-color': sellColor,
                '--flash-color': sellColor,
            } as React.CSSProperties;
        }
        return {};
    };

    return (
        <Link
            to={`/v2/trade/${coin.symbol}`}
            className={`${styles.tickerItem} ${
                priceChangeState === 'up'
                    ? styles.priceUp
                    : priceChangeState === 'down'
                      ? styles.priceDown
                      : ''
            }`}
            style={getFlashStyle()}
            viewTransition
        >
            <span className={styles.symbol}>{coin.symbol}</span>
            <span className={styles.price}>
                {formatNum(coin.markPx, undefined, true, true)}
            </span>
            <span
                className={
                    coin.last24hPriceChangePercent > -0.1 &&
                    coin.last24hPriceChangePercent < 0.1
                        ? styles.changeZero
                        : coin.last24hPriceChangePercent >= 0.1
                          ? styles.changePositive
                          : styles.changeNegative
                }
                style={{
                    color:
                        coin.last24hPriceChangePercent >= 0.1
                            ? buyColor
                            : coin.last24hPriceChangePercent <= -0.1
                              ? sellColor
                              : undefined,
                }}
            >
                {coin.last24hPriceChangePercent >= 0.1 ? '+' : ''}
                {coin.last24hPriceChangePercent > -0.1 &&
                coin.last24hPriceChangePercent < 0.1
                    ? '0.0'
                    : formatNum(coin.last24hPriceChangePercent, 1)}
                %
            </span>
        </Link>
    );
});

// Main Ticker component
export const Ticker = memo(function Ticker() {
    const firstSetRef = useRef<HTMLDivElement | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const prevPriceChangePercentNumberRef = useRef<Record<string, number>>({});

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

    // Track price changes and determine animation state
    const getPriceChangeState = useCallback((coin: CoinData) => {
        if (!coin || !coin.symbol) return null;
        if (!prevPriceChangePercentNumberRef.current[coin.symbol]) {
            prevPriceChangePercentNumberRef.current[coin.symbol] =
                coin.last24hPriceChangePercent;
            return null;
        }

        const prevPriceChangePercentNumber =
            prevPriceChangePercentNumberRef.current[coin.symbol];

        const lastChangeTruncated = formatNum(
            coin.last24hPriceChangePercent,
            1,
        );
        const change =
            coin.last24hPriceChangePercent - prevPriceChangePercentNumber;

        if (coin.symbol.toLowerCase() === 'eth') {
            console.log({ coin, change });
            console.log(coin.last24hPriceChangePercent);
        }

        const prevPriceChangePercentTruncated = formatNum(
            prevPriceChangePercentNumber,
            1,
        );
        // Only update previous price if the change is significant
        if (lastChangeTruncated !== prevPriceChangePercentTruncated) {
            prevPriceChangePercentNumberRef.current[coin.symbol] =
                coin.last24hPriceChangePercent;
            return change > 0 ? 'up' : 'down';
        }

        return null;
    }, []);

    // Memoize the ticker items to prevent unnecessary re-renders
    const tickerItems = useMemo(() => {
        if (!memoizedCoins || memoizedCoins.length === 0) return null;

        return (
            <div className={styles.tickerSet} ref={firstSetRef}>
                {memoizedCoins.map((coin: CoinData, coinIndex) => {
                    // Get the price change state for this specific coin
                    const priceChangeState = getPriceChangeState(coin);

                    return (
                        <TickerItem
                            key={`${coin.symbol}-${coinIndex}`}
                            coin={coin}
                            formatNum={formatNum}
                            priceChangeState={priceChangeState}
                        />
                    );
                })}
            </div>
        );
    }, [memoizedCoins, formatNum, getPriceChangeState]);

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
            className={`${styles.tickerContainer} ${isPaused ? styles.paused : ''}`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className={styles.tickerTrack} ref={trackRef}>
                {tickerItems}
            </div>
        </div>
    );
});
