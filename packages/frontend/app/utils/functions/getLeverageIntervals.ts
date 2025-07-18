export const leverageIntervalsMap = new Map([
    [3, [1, 1.5, 2, 2.5, 3]],
    [5, [1, 1.5, 2, 3, 4, 5]],
    [10, [1, 2, 3, 5, 7, 10]],
    [20, [1, 3, 5, 10, 20]],
    [25, [1, 3, 5, 10, 25]],
    [40, [1, 3, 5, 10, 20, 40]],
    [50, [1, 5, 10, 20, 40, 50]],
    [100, [1, 5, 10, 50, 100]],
]);

// Configuration for fallback logarithmic generation
const LEVERAGE_CONFIG = {
    MAX_LEVERAGE_FOR_DECIMALS: 3,
    DECIMAL_INCREMENT: 0.1,
    TICK_COUNT_HIGH_LEVERAGE: 7,
    TICK_COUNT_LOW_LEVERAGE: 5,
    TICK_COUNT_THRESHOLD: 100,
    MIN_SAFE_LOG_VALUE: 0.1,
};

/**
 * Generates logarithmic tick marks as fallback for unsupported max leverage values
 */
const generateLogarithmicTicks = (
    min: number,
    max: number,
    count: number,
): number[] => {
    // For low leverage (≤ threshold), use linear distribution with decimal increments
    if (max <= LEVERAGE_CONFIG.MAX_LEVERAGE_FOR_DECIMALS) {
        const ticks = [];
        const step = (max - min) / (count - 1);
        for (let i = 0; i < count; i++) {
            const value = min + step * i;
            ticks.push(
                Math.round(value / LEVERAGE_CONFIG.DECIMAL_INCREMENT) *
                    LEVERAGE_CONFIG.DECIMAL_INCREMENT,
            );
        }
        return ticks;
    }

    // For higher leverage, use logarithmic distribution with whole numbers
    const safeMin = Math.max(LEVERAGE_CONFIG.MIN_SAFE_LOG_VALUE, min);
    const minLog = Math.log(safeMin);
    const maxLog = Math.log(max);
    const ticks = [];

    // Always include min and max
    ticks.push(Math.round(min));

    // Generate intermediate ticks (logarithmically distributed)
    if (count > 2) {
        const step = (maxLog - minLog) / (count - 1);
        for (let i = 1; i < count - 1; i++) {
            const logValue = minLog + step * i;
            const value = Math.round(Math.exp(logValue));
            if (value > ticks[ticks.length - 1] && value < max) {
                ticks.push(value);
            }
        }
    }

    // Make sure max is included
    if (ticks[ticks.length - 1] !== Math.round(max)) {
        ticks.push(Math.round(max));
    }

    return ticks;
};

/**
 * Gets leverage intervals for a given max leverage value
 * Uses predefined intervals when available, falls back to logarithmic generation
 */
export const getLeverageIntervals = (
    maxLeverage: number,
    minLeverage: number = 1,
): number[] => {
    // First, try to get predefined intervals
    const predefinedIntervals = leverageIntervalsMap.get(maxLeverage);

    if (predefinedIntervals) {
        // Filter intervals to ensure they're within min/max bounds
        return predefinedIntervals.filter(
            (interval) => interval >= minLeverage && interval <= maxLeverage,
        );
    }

    // Fallback to logarithmic generation for unsupported max leverage values
    console.log(
        `No predefined intervals for ${maxLeverage}x, using logarithmic fallback`,
    );

    // Validate inputs
    if (
        isNaN(minLeverage) ||
        isNaN(maxLeverage) ||
        minLeverage <= 0 ||
        maxLeverage <= minLeverage
    ) {
        console.warn('Invalid leverage range, returning default intervals');
        return [minLeverage, maxLeverage];
    }

    // Generate tick count based on range
    const tickCount =
        maxLeverage > LEVERAGE_CONFIG.TICK_COUNT_THRESHOLD
            ? LEVERAGE_CONFIG.TICK_COUNT_HIGH_LEVERAGE
            : LEVERAGE_CONFIG.TICK_COUNT_LOW_LEVERAGE;

    return generateLogarithmicTicks(minLeverage, maxLeverage, tickCount);
};

/**
 * Utility to check if a max leverage value has predefined intervals
 */
export const hasPredefinedIntervals = (maxLeverage: number): boolean => {
    return leverageIntervalsMap.has(maxLeverage);
};

/**
 * Get all supported max leverage values
 */
export const getSupportedMaxLeverageValues = (): number[] => {
    return Array.from(leverageIntervalsMap.keys()).sort((a, b) => a - b);
};
