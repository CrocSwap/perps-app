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
    const prevDisplayedChangeRef = useRef<Record<string, string>>({});
    const [priceChangeStates, setPriceChangeStates] = useState<
        Record<string, 'up' | 'down' | null>
    >({});
    const priceChangeTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
    const animationResetTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>(
        {},
    );
    const scrollPositionRef = useRef<number>(0);
    const isHoveringRef = useRef<boolean>(false);
    const animationFrameRef = useRef<number | null>(null);
    const isMacOSRef = useRef<boolean>(
        (navigator as any).userAgentData?.platform
            ?.toLowerCase()
            .includes('mac') ||
            navigator.userAgent.toLowerCase().includes('mac os x'),
    );

    // Get coins from store with proper typing
    const coins = useTradeDataStore((state) => {
        // Ensure we have valid coins data
        if (!state.coins || !Array.isArray(state.coins)) return [];
        return state.coins as CoinData[];
    });

    // Create a safe array of coins limited to 15 items with stable reference
    // Depend on coins directly - the store should handle memoization
    const memoizedCoins = useMemo(() => {
        if (!coins || coins.length === 0) return [];
        return coins.slice(0, 15);
    }, [coins]);

    // Memoize the formatNum function and color values
    const { formatNum, parseFormattedNum } = useNumFormatter();
    const { bsColor, numFormat } = useAppSettings();
    const colors = useMemo(() => {
        const { getBsColor } = useAppSettings.getState();
        return getBsColor();
    }, [bsColor]);
    const { buy: buyColor, sell: sellColor } = colors;

    // Track price changes and trigger animations
    useEffect(() => {
        // Skip if no coins to avoid unnecessary work
        if (!memoizedCoins.length) return;

        memoizedCoins.forEach((coin) => {
            if (!coin || !coin.symbol) return;

            // Check if values are in the "zero change" range (-0.1 to 0.1)
            // This matches the display logic in TickerItem
            const currentIsZero =
                coin.last24hPriceChangePercent > -0.1 &&
                coin.last24hPriceChangePercent < 0.1;

            // Calculate the displayed string (what the user actually sees)
            const currentDisplayedChange = currentIsZero
                ? '0.0'
                : formatNum(coin.last24hPriceChangePercent, 1);

            // Get the previous displayed value
            const prevDisplayedChange =
                prevDisplayedChangeRef.current[coin.symbol];

            // Initialize if this is the first time we're seeing this coin
            if (prevDisplayedChange === undefined) {
                prevDisplayedChangeRef.current[coin.symbol] =
                    currentDisplayedChange;
                return;
            }

            // Only trigger animation if the DISPLAYED value changed
            if (currentDisplayedChange !== prevDisplayedChange) {
                // Determine direction based on current vs previous raw values
                const prevPriceChangePercentNumber =
                    parseFormattedNum(prevDisplayedChange);
                const change =
                    parseFormattedNum(currentDisplayedChange) -
                    prevPriceChangePercentNumber;
                const newState = change > 0 ? 'up' : 'down';

                // Clear any existing timeouts for this coin
                if (priceChangeTimeoutsRef.current[coin.symbol]) {
                    clearTimeout(priceChangeTimeoutsRef.current[coin.symbol]);
                }
                if (animationResetTimeoutsRef.current[coin.symbol]) {
                    clearTimeout(
                        animationResetTimeoutsRef.current[coin.symbol],
                    );
                }

                // Immediately set to null to force animation restart
                setPriceChangeStates((prev) => ({
                    ...prev,
                    [coin.symbol]: null,
                }));

                prevDisplayedChangeRef.current[coin.symbol] =
                    currentDisplayedChange;

                // Use setTimeout to apply the new state after null is rendered
                // This forces a reflow and ensures the animation restarts
                priceChangeTimeoutsRef.current[coin.symbol] = setTimeout(() => {
                    setPriceChangeStates((prev) => ({
                        ...prev,
                        [coin.symbol]: newState,
                    }));

                    // Clear the animation state after 3 seconds to match CSS animation
                    animationResetTimeoutsRef.current[coin.symbol] = setTimeout(
                        () => {
                            setPriceChangeStates((prev) => ({
                                ...prev,
                                [coin.symbol]: null,
                            }));
                        },
                        3000,
                    );
                }, 10);
            }
        });

        // Clean up all timeouts when effect re-runs or unmounts
        return () => {
            Object.values(priceChangeTimeoutsRef.current).forEach((timeout) => {
                clearTimeout(timeout);
            });
            Object.values(animationResetTimeoutsRef.current).forEach(
                (timeout) => {
                    clearTimeout(timeout);
                },
            );
            priceChangeTimeoutsRef.current = {};
            animationResetTimeoutsRef.current = {};
        };
    }, [memoizedCoins, formatNum]);

    // Reset cached displayed changes when number format changes so comparisons stay consistent
    useEffect(() => {
        prevDisplayedChangeRef.current = {};
        Object.values(priceChangeTimeoutsRef.current).forEach((timeout) => {
            clearTimeout(timeout);
        });
        Object.values(animationResetTimeoutsRef.current).forEach((timeout) => {
            clearTimeout(timeout);
        });
        priceChangeTimeoutsRef.current = {};
        animationResetTimeoutsRef.current = {};
        setPriceChangeStates({});
    }, [numFormat]);

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

        // Use cached macOS detection
        const deltaY = isMacOSRef.current ? -e.deltaY : e.deltaY;

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
