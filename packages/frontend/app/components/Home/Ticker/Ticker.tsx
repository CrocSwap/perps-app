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
    const [priceChangeStates, setPriceChangeStates] = useState<
        Record<string, 'up' | 'down' | null>
    >({});
    const priceChangeTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Get coins from store with proper typing
    const coins = useTradeDataStore((state) => {
        // Ensure we have valid coins data
        if (!state.coins || !Array.isArray(state.coins)) return [];
        return state.coins as CoinData[];
    });

    // Create a safe array of coins limited to 15 items
    const memoizedCoins = useMemo(() => {
        if (!coins || coins.length === 0) return [];

        // Limit to maximum 15 items
        const maxItems = 15;
        const limitedCoins = coins.slice(0, Math.min(maxItems, coins.length));

        return limitedCoins;
    }, [
        JSON.stringify(
            coins.slice(0, 15).map((coin) => ({
                symbol: coin.symbol,
                markPx: coin.markPx,
                last24hPriceChangePercent: coin.last24hPriceChangePercent,
            })),
        ),
    ]);

    // Memoize the formatNum function
    const { formatNum } = useNumFormatter();

    // Track price changes and trigger animations that last at least 5 seconds
    useEffect(() => {
        memoizedCoins.forEach((coin) => {
            if (!coin || !coin.symbol) return;

            // Initialize previous price if not set
            if (!prevPriceChangePercentNumberRef.current[coin.symbol]) {
                prevPriceChangePercentNumberRef.current[coin.symbol] =
                    coin.last24hPriceChangePercent;
                return;
            }

            const prevPriceChangePercentNumber =
                prevPriceChangePercentNumberRef.current[coin.symbol];

            const lastChangeTruncated = formatNum(
                coin.last24hPriceChangePercent,
                1,
            );
            const prevPriceChangePercentTruncated = formatNum(
                prevPriceChangePercentNumber,
                1,
            );

            // Only trigger animation if the truncated value changed
            if (lastChangeTruncated !== prevPriceChangePercentTruncated) {
                const change =
                    coin.last24hPriceChangePercent -
                    prevPriceChangePercentNumber;
                const newState = change > 0 ? 'up' : 'down';

                // Clear any existing timeout for this coin
                if (priceChangeTimeoutsRef.current[coin.symbol]) {
                    clearTimeout(priceChangeTimeoutsRef.current[coin.symbol]);
                }

                // Set the new animation state
                setPriceChangeStates((prev) => ({
                    ...prev,
                    [coin.symbol]: newState,
                }));

                // Update the stored price
                prevPriceChangePercentNumberRef.current[coin.symbol] =
                    coin.last24hPriceChangePercent;

                // Clear the animation state after 5 seconds
                priceChangeTimeoutsRef.current[coin.symbol] = setTimeout(() => {
                    setPriceChangeStates((prev) => ({
                        ...prev,
                        [coin.symbol]: null,
                    }));
                }, 5000);
            }
        });
    }, [memoizedCoins, formatNum]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(priceChangeTimeoutsRef.current).forEach((timeout) => {
                clearTimeout(timeout);
            });
        };
    }, []);

    // Create ticker set component
    const renderTickerSet = (
        keyPrefix: string,
        setRef?: React.RefObject<HTMLDivElement | null>,
    ) => {
        if (!memoizedCoins || memoizedCoins.length === 0) return null;

        return (
            <div className={styles.tickerSet} ref={setRef || null}>
                {memoizedCoins.map((coin: CoinData, coinIndex) => {
                    // Get the price change state for this specific coin
                    const priceChangeState =
                        priceChangeStates[coin.symbol] || null;

                    return (
                        <TickerItem
                            key={`${keyPrefix}-${coin.symbol}-${coinIndex}`}
                            coin={coin}
                            formatNum={formatNum}
                            priceChangeState={priceChangeState}
                        />
                    );
                })}
            </div>
        );
    };

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
                {renderTickerSet('set1', firstSetRef)}
                {renderTickerSet('set2')}
            </div>
        </div>
    );
});
