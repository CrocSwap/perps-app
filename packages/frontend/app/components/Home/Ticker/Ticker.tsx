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
    coin: CoinData;
    formatNum: (
        value: number,
        decimals?: number,
        compact?: boolean,
        isPrice?: boolean,
    ) => string;
    priceChangeState: 'up' | 'down' | null;
    buyColor: string;
    sellColor: string;
}

const TickerItem = memo(function TickerItem({
    coin,
    formatNum,
    priceChangeState,
    buyColor,
    sellColor,
}: TickerItemProps) {
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

    // Memoize change calculations
    const isZeroChange =
        coin.last24hPriceChangePercent > -0.1 &&
        coin.last24hPriceChangePercent < 0.1;
    const isPositive = coin.last24hPriceChangePercent >= 0.1;
    const isNegative = coin.last24hPriceChangePercent <= -0.1;

    const changeClassName = isZeroChange
        ? styles.changeZero
        : isPositive
          ? styles.changePositive
          : styles.changeNegative;

    const changeColor = isPositive
        ? buyColor
        : isNegative
          ? sellColor
          : undefined;
    const formattedChange = isZeroChange
        ? '0.0'
        : formatNum(coin.last24hPriceChangePercent, 1);

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
            aria-label={`${coin.symbol} trading at ${formatNum(coin.markPx, undefined, true, true)}, ${isPositive ? 'up' : isNegative ? 'down' : ''} ${formattedChange}%`}
        >
            <span className={styles.symbol}>{coin.symbol}</span>
            <span className={styles.price}>
                {formatNum(coin.markPx, undefined, true, true)}
            </span>
            <span className={changeClassName} style={{ color: changeColor }}>
                {isPositive ? '+' : ''}
                {formattedChange}%
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
    const scrollPositionRef = useRef<number>(0);
    const isHoveringRef = useRef<boolean>(false);
    const animationFrameRef = useRef<number | null>(null);

    // Get coins from store with proper typing
    const coins = useTradeDataStore((state) => {
        // Ensure we have valid coins data
        if (!state.coins || !Array.isArray(state.coins)) return [];
        return state.coins as CoinData[];
    });

    // Create a stable key for coins memoization
    const coinsKey = coins
        .slice(0, 15)
        .map(
            (coin) =>
                `${coin.symbol}-${coin.markPx}-${coin.last24hPriceChangePercent}`,
        )
        .join('|');

    // Create a safe array of coins limited to 15 items
    const memoizedCoins = useMemo(() => {
        if (!coins || coins.length === 0) return [];
        return coins.slice(0, 15);
    }, [coinsKey]);

    // Memoize the formatNum function and color values
    const { formatNum } = useNumFormatter();
    const bsColor = useAppSettings((state) => state.bsColor);
    const colors = useMemo(() => {
        const { getBsColor } = useAppSettings.getState();
        return getBsColor();
    }, [bsColor]);
    const { buy: buyColor, sell: sellColor } = colors;

    // Track price changes and trigger animations - batch state updates
    useEffect(() => {
        const updates: Record<string, 'up' | 'down' | null> = {};
        let hasUpdates = false;

        memoizedCoins.forEach((coin) => {
            if (!coin || !coin.symbol) return;

            // Initialize previous price if not set
            if (
                prevPriceChangePercentNumberRef.current[coin.symbol] ===
                undefined
            ) {
                prevPriceChangePercentNumberRef.current[coin.symbol] =
                    coin.last24hPriceChangePercent;
                return;
            }

            const prevPriceChangePercentNumber =
                prevPriceChangePercentNumberRef.current[coin.symbol];

            // Check if values are in the "zero change" range (-0.1 to 0.1)
            // This matches the display logic in TickerItem
            const currentIsZero =
                coin.last24hPriceChangePercent > -0.1 &&
                coin.last24hPriceChangePercent < 0.1;
            const prevIsZero =
                prevPriceChangePercentNumber > -0.1 &&
                prevPriceChangePercentNumber < 0.1;

            // If both are in zero range, don't trigger animation
            if (currentIsZero && prevIsZero) {
                return;
            }

            // Use the same formatting logic as the display: "0.0" for zero range
            const lastChangeTruncated = currentIsZero
                ? '0.0'
                : formatNum(coin.last24hPriceChangePercent, 1);
            const prevPriceChangePercentTruncated = prevIsZero
                ? '0.0'
                : formatNum(prevPriceChangePercentNumber, 1);

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

                updates[coin.symbol] = newState;
                hasUpdates = true;

                // Update the stored price
                prevPriceChangePercentNumberRef.current[coin.symbol] =
                    coin.last24hPriceChangePercent;

                // Clear the animation state after 2 seconds (reduced from 5)
                priceChangeTimeoutsRef.current[coin.symbol] = setTimeout(() => {
                    setPriceChangeStates((prev) => ({
                        ...prev,
                        [coin.symbol]: null,
                    }));
                }, 2000);
            }
        });

        // Batch all state updates into a single setState call
        if (hasUpdates) {
            setPriceChangeStates((prev) => ({ ...prev, ...updates }));
        }

        // Clean up all timeouts when effect re-runs or unmounts
        return () => {
            Object.values(priceChangeTimeoutsRef.current).forEach((timeout) => {
                clearTimeout(timeout);
            });
            priceChangeTimeoutsRef.current = {};
        };
    }, [memoizedCoins, formatNum]);

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
                            buyColor={buyColor}
                            sellColor={sellColor}
                        />
                    );
                })}
            </div>
        );
    };

    // Handle wheel scrolling
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        if (!trackRef.current || !firstSetRef.current) return;

        const track = trackRef.current;
        const firstSet = firstSetRef.current;
        const setWidth = firstSet.offsetWidth;

        // Detect macOS - use modern userAgentData if available, fallback to platform
        const isMacOS =
            (navigator as any).userAgentData?.platform
                ?.toLowerCase()
                .includes('mac') ||
            navigator.userAgent.toLowerCase().includes('mac os x');
        const deltaY = isMacOS ? -e.deltaY : e.deltaY;

        // Update scroll position
        scrollPositionRef.current += deltaY * 0.5;

        // Wrap around to create endless effect
        // The animation goes from 0 to -50% (one set width)
        while (scrollPositionRef.current <= -setWidth) {
            scrollPositionRef.current += setWidth;
        }
        while (scrollPositionRef.current > 0) {
            scrollPositionRef.current -= setWidth;
        }

        // Apply the transform
        track.style.transform = `translate3d(${scrollPositionRef.current}px, 0, 0)`;
    }, []);

    // Handle mouse enter - pause and capture current position
    const handleMouseEnter = useCallback(() => {
        if (!trackRef.current || !firstSetRef.current) return;

        const track = trackRef.current;

        // Cancel any ongoing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // If CSS animation is still running, capture its position
        const computedStyle = window.getComputedStyle(track);
        const matrix = new DOMMatrix(computedStyle.transform);

        // Capture current position from animation or transform
        scrollPositionRef.current = matrix.m41;
        isHoveringRef.current = true;

        // Pause animation and set to current position
        track.style.animation = 'none';
        track.style.transform = `translate3d(${scrollPositionRef.current}px, 0, 0)`;

        setIsPaused(true);
    }, []);

    // Animate the ticker continuously using requestAnimationFrame
    const animateTicker = useCallback(() => {
        if (!trackRef.current || !firstSetRef.current || isHoveringRef.current)
            return;

        const track = trackRef.current;
        const firstSet = firstSetRef.current;
        const setWidth = firstSet.offsetWidth;

        // Get animation duration from CSS (60s default, 45s on mobile)
        const animationDuration = window.innerWidth <= 768 ? 45 : 60;
        // Speed in pixels per second
        const speed = setWidth / animationDuration;
        // Move by speed/60 pixels per frame (assuming 60fps)
        const moveAmount = speed / 60;

        // Update position
        scrollPositionRef.current -= moveAmount;

        // Wrap around to create endless effect
        if (scrollPositionRef.current <= -setWidth) {
            scrollPositionRef.current += setWidth;
        }

        // Apply the transform
        track.style.transform = `translate3d(${scrollPositionRef.current}px, 0, 0)`;

        // Continue animation
        animationFrameRef.current = requestAnimationFrame(animateTicker);
    }, []);

    // Handle mouse leave - resume animation from current position
    const handleMouseLeave = useCallback(() => {
        if (!trackRef.current || !firstSetRef.current) return;

        isHoveringRef.current = false;
        setIsPaused(false);

        // Start the animation loop from current position
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(animateTicker);
    }, [animateTicker]);

    // Initialize animation on mount and cleanup on unmount
    useEffect(() => {
        // Let CSS animation run initially for 2 seconds (as per animation-delay)
        const initTimeout = setTimeout(() => {
            if (
                !isHoveringRef.current &&
                trackRef.current &&
                firstSetRef.current
            ) {
                const track = trackRef.current;
                const computedStyle = window.getComputedStyle(track);
                const matrix = new DOMMatrix(computedStyle.transform);
                scrollPositionRef.current = matrix.m41;

                // Switch to requestAnimationFrame after initial CSS animation
                track.style.animation = 'none';
                animationFrameRef.current =
                    requestAnimationFrame(animateTicker);
            }
        }, 2000);

        return () => {
            clearTimeout(initTimeout);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [animateTicker]);

    if (!memoizedCoins || memoizedCoins.length === 0) {
        return null;
    }

    return (
        <div
            className={`${styles.tickerContainer} ${isPaused ? styles.paused : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            role='region'
            aria-label='Market ticker showing cryptocurrency prices'
        >
            <div className={styles.tickerTrack} ref={trackRef}>
                {renderTickerSet('set1', firstSetRef)}
                {renderTickerSet('set2')}
            </div>
        </div>
    );
});
