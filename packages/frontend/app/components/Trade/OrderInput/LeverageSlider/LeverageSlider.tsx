import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLeverageStore } from '~/stores/LeverageStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getLeverageIntervals } from '~/utils/functions/getLeverageIntervals';
import styles from './LeverageSlider.module.css';

interface LeverageSliderProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    minimumInputValue?: number;
    generateRandomMaximumInput: () => void;
}

const LEVERAGE_CONFIG = {
    // Maximum leverage value that should use decimal increments (0.1)
    MAX_LEVERAGE_FOR_DECIMALS: 3,

    // Decimal precision for low leverage values
    DECIMAL_PLACES_FOR_LOW_LEVERAGE: 1,

    // Step increment for decimal leverage values
    DECIMAL_INCREMENT: 0.1,

    // Default fallback max leverage when symbolInfo is not available
    DEFAULT_MAX_LEVERAGE: 1,

    // Number of tick marks to show on slider
    TICK_COUNT_HIGH_LEVERAGE: 7,
    TICK_COUNT_LOW_LEVERAGE: 5,
    TICK_COUNT_THRESHOLD: 100,
} as const;

const SLIDER_CONFIG = {
    // Knob radius in pixels for position calculations
    KNOB_RADIUS: 7,

    // Color stops for leverage slider gradient
    COLOR_STOPS: [
        { position: 0, color: '#26A69A' }, // teal
        { position: 25, color: '#89C374' }, // green
        { position: 50, color: '#EBDF4E' }, // yellow
        { position: 75, color: '#EE9A4F' }, // orange
        { position: 100, color: '#EF5350' }, // red
    ],

    // Threshold for detecting "current" value on tick marks  (determines when tickmarks are highlighted)
    CURRENT_VALUE_THRESHOLD: 0.1,
} as const;

const UI_CONFIG = {
    // Default opacity values
    INACTIVE_TICK_OPACITY: 0.3,

    // Color values
    INACTIVE_LABEL_COLOR: '#808080',

    // Minimum safe value for logarithmic calculations (so it never results in nan)
    MIN_SAFE_LOG_VALUE: 0.1,
} as const;

export default function LeverageSlider({
    value,
    onChange,
    className = '',
    minimumInputValue = 1,
}: LeverageSliderProps) {
    const { symbolInfo } = useTradeDataStore();
    const {
        currentMarket,
        setPreferredLeverage,
        validateAndApplyLeverageForMarket,
        getPreferredLeverage,
    } = useLeverageStore();

    // Use maxLeverage from symbolInfo, fallback to default if not available
    const maximumInputValue =
        symbolInfo?.coin === 'BTC'
            ? 100
            : symbolInfo?.maxLeverage || LEVERAGE_CONFIG.DEFAULT_MAX_LEVERAGE;

    // Always default to 1x leverage if no value provided
    const currentValue = value ?? 1;
    const [inputValue, setInputValue] = useState<string>(
        currentValue.toString(),
    );
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [tickMarks, setTickMarks] = useState<number[]>([]);
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [isHovering, setIsHovering] = useState<boolean>(false);
    const [hoveredTickIndex, setHoveredTickIndex] = useState<number | null>(
        null,
    );
    const [hasInitializedLeverage, setHasInitializedLeverage] =
        useState<boolean>(false);

    const sliderRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);

    // Helper function to get the actual rounded value (what user sees)
    const getRoundedDisplayValue = (val: number): number => {
        if (val < 3) {
            // Round DOWN to nearest tenth
            return Math.floor(val * 10) / 10;
        } else {
            // Round DOWN to nearest whole number
            return Math.floor(val);
        }
    };

    // Helper function to format values for input display (shows decimals below 3)
    const formatValue = (val: number): string => {
        if (val < 3) {
            // Round DOWN to nearest tenth, then format
            const roundedVal = Math.floor(val * 10) / 10;
            return roundedVal.toFixed(
                LEVERAGE_CONFIG.DECIMAL_PLACES_FOR_LOW_LEVERAGE,
            );
        } else {
            // Round DOWN to nearest whole number
            return Math.floor(val).toString();
        }
    };

    // format values for labels
    const formatLabelValue = (val: number): string => {
        return Math.floor(val).toString();
    };

    const constrainValue = (val: number): number => {
        return Math.max(minimumInputValue, Math.min(maximumInputValue, val));
    };

    const handleLeverageChange = (newLeverage: number) => {
        // Update the preferred leverage in store with the exact value (no rounding)
        setPreferredLeverage(newLeverage);

        // Also call the parent onChange with the exact value
        onChange(newLeverage);
    };

    const handleMarketChange = useCallback(() => {
        const effectiveSymbol = symbolInfo?.coin;
        const currentMaxLeverage =
            effectiveSymbol === 'BTC' ? 100 : symbolInfo?.maxLeverage;

        if (!effectiveSymbol || !currentMaxLeverage) {
            return;
        }

        // Check if market has changed or if this is the first initialization
        const isMarketChange = currentMarket !== effectiveSymbol;
        const isFirstLoad = !hasInitializedLeverage;

        if (isMarketChange || isFirstLoad) {
            console.log(
                `LeverageSlider: Applying leverage for ${effectiveSymbol} (${currentMaxLeverage}x max)`,
            );

            // Validate and apply leverage for this market
            const validatedLeverage = validateAndApplyLeverageForMarket(
                effectiveSymbol,
                currentMaxLeverage,
                minimumInputValue,
            );

            // Use the exact validated leverage
            onChange(validatedLeverage);
            setHasInitializedLeverage(true);
        } else {
            // Even if no market change, ensure we have the right leverage for the current maxLeverage
            const currentPreference = getPreferredLeverage();
            const shouldUpdate =
                currentPreference !== value ||
                currentMaxLeverage !== maximumInputValue;

            if (shouldUpdate) {
                console.log(
                    `LeverageSlider: Correcting leverage for ${effectiveSymbol} due to maxLeverage change`,
                );

                const validatedLeverage = validateAndApplyLeverageForMarket(
                    effectiveSymbol,
                    currentMaxLeverage,
                    minimumInputValue,
                );

                // Use the exact validated leverage (no rounding)
                onChange(validatedLeverage);
            }
        }
    }, [
        symbolInfo?.coin,
        symbolInfo?.maxLeverage,
        currentMarket,
        minimumInputValue,
        hasInitializedLeverage,
    ]);

    // Market change detection and leverage validation
    useEffect(() => {
        handleMarketChange();
    }, [handleMarketChange]);

    // Handle smooth leverage changes during dragging (no rounding)
    const handleSmoothLeverageChange = (newLeverage: number) => {
        // During dragging, don't round - just update parent with smooth value
        onChange(newLeverage);
    };

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(formatValue(currentValue));
    }, [currentValue, maximumInputValue]);

    // Initialize input value on first render and notify parent if no value was provided
    useEffect(() => {
        if (inputValue === '') {
            setInputValue(formatValue(currentValue));
            // If no value was provided, set it to 1x
            if (value === undefined || value === null) {
                handleLeverageChange(1);
            }
        }
    }, [maximumInputValue]);

    // Generate tick marks using centralized logic
    useEffect(() => {
        const ticks = getLeverageIntervals(
            maximumInputValue,
            minimumInputValue,
        );
        setTickMarks(ticks);
    }, [minimumInputValue, maximumInputValue]);

    // Convert value to percentage position on slider
    const valueToPercentage = (val: number): number => {
        // Check for invalid inputs
        if (isNaN(val) || isNaN(minimumInputValue) || isNaN(maximumInputValue))
            return 0;
        if (minimumInputValue <= 0 || maximumInputValue <= minimumInputValue)
            return 0;

        // Safety check to prevent errors
        const safeVal = Math.max(
            minimumInputValue,
            Math.min(maximumInputValue, val),
        );

        // For low leverage (≤ threshold), use linear scale
        if (maximumInputValue <= LEVERAGE_CONFIG.MAX_LEVERAGE_FOR_DECIMALS) {
            return (
                ((safeVal - minimumInputValue) /
                    (maximumInputValue - minimumInputValue)) *
                100
            );
        }

        // For higher leverage, use logarithmic scale
        const safeMin = Math.max(
            UI_CONFIG.MIN_SAFE_LOG_VALUE,
            minimumInputValue,
        );

        try {
            const minLog = Math.log(safeMin);
            const maxLog = Math.log(maximumInputValue);
            const valueLog = Math.log(safeVal);

            // Percentage calculation
            return ((valueLog - minLog) / (maxLog - minLog)) * 100;
        } catch (error) {
            console.error('Error calculating percentage:', error);
            return 0;
        }
    };

    // Convert percentage position to value (no rounding for smooth movement)
    const percentageToValue = (percentage: number): number => {
        if (minimumInputValue <= 0 || maximumInputValue <= minimumInputValue)
            return minimumInputValue;

        // Bound the percentage between 0 and 100
        const boundedPercentage = Math.max(0, Math.min(100, percentage));

        // For low leverage (≤ threshold), use linear scale
        if (maximumInputValue <= LEVERAGE_CONFIG.MAX_LEVERAGE_FOR_DECIMALS) {
            const value =
                minimumInputValue +
                (boundedPercentage / 100) *
                    (maximumInputValue - minimumInputValue);
            return value; // No rounding for smooth movement
        }

        // For higher leverage, use logarithmic scale
        const safeMin = Math.max(
            UI_CONFIG.MIN_SAFE_LOG_VALUE,
            minimumInputValue,
        );
        const minLog = Math.log(safeMin);
        const maxLog = Math.log(maximumInputValue);
        const valueLog = minLog + (boundedPercentage / 100) * (maxLog - minLog);

        return Math.exp(valueLog);
    };

    // Get position for the knob as percentage
    const getKnobPosition = (): number => {
        if (isNaN(currentValue)) {
            return 0;
        }
        return valueToPercentage(currentValue);
    };

    // Get color based on position
    const getColorAtPosition = (position: number): string => {
        const colorStops = SLIDER_CONFIG.COLOR_STOPS;

        // Ensure position is between 0 and 100
        const boundedPosition = Math.max(0, Math.min(100, position));

        // Find the two color stops that our position falls between
        let lowerStop = colorStops[0];
        let upperStop = colorStops[colorStops.length - 1];

        for (let i = 0; i < colorStops.length - 1; i++) {
            if (
                boundedPosition >= colorStops[i].position &&
                boundedPosition <= colorStops[i + 1].position
            ) {
                lowerStop = colorStops[i];
                upperStop = colorStops[i + 1];
                break;
            }
        }

        // If exactly on a stop, return that color
        if (boundedPosition === lowerStop.position) return lowerStop.color;
        if (boundedPosition === upperStop.position) return upperStop.color;

        // Calculate the color interpolation factor
        const factor =
            (boundedPosition - lowerStop.position) /
            (upperStop.position - lowerStop.position);

        // Parse the hex colors to RGB
        const parseColor = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };

        const lowerColor = parseColor(lowerStop.color);
        const upperColor = parseColor(upperStop.color);

        // Interpolate between the two colors
        const r = Math.round(
            lowerColor.r + factor * (upperColor.r - lowerColor.r),
        );
        const g = Math.round(
            lowerColor.g + factor * (upperColor.g - lowerColor.g),
        );
        const b = Math.round(
            lowerColor.b + factor * (upperColor.b - lowerColor.b),
        );

        return `rgb(${r}, ${g}, ${b})`;
    };

    // Get color for the knob based on percentage position
    const getKnobColor = (): string => {
        return getColorAtPosition(getKnobPosition());
    };

    // Handle mouse move over track for hover preview
    const handleTrackMouseMove = (e: React.MouseEvent) => {
        if (!sliderRef.current || isDragging) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(
            0,
            Math.min(e.clientX - rect.left, rect.width),
        );

        // Account for knob margins when calculating percentage
        const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
        const adjustedOffsetX = Math.max(
            knobRadius,
            Math.min(offsetX, rect.width - knobRadius),
        );
        const percentage =
            ((adjustedOffsetX - knobRadius) / (rect.width - 2 * knobRadius)) *
            100;

        // Convert percentage to value (no rounding for smooth preview)
        const newValue = percentageToValue(percentage);

        // Ensure value is within min/max bounds
        const boundedValue = constrainValue(newValue);

        setHoverValue(boundedValue);
        setIsHovering(true);
        // Clear any tick-specific hover when hovering over track
        setHoveredTickIndex(null);
    };

    // Handle mouse leave from track
    const handleTrackMouseLeave = () => {
        setIsHovering(false);
        setHoverValue(null);
        setHoveredTickIndex(null);
    };

    // Handle track click to set value
    const handleTrackClick = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(
            0,
            Math.min(e.clientX - rect.left, rect.width),
        );

        // Account for knob margins when calculating percentage
        const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
        const adjustedOffsetX = Math.max(
            knobRadius,
            Math.min(offsetX, rect.width - knobRadius),
        );
        const percentage =
            ((adjustedOffsetX - knobRadius) / (rect.width - 2 * knobRadius)) *
            100;

        // Convert percentage to value (no rounding for smooth movement)
        const newValue = percentageToValue(percentage);

        // Ensure value is within min/max bounds
        const boundedValue = constrainValue(newValue);

        // Use the exact value for clicks (no rounding)
        handleLeverageChange(boundedValue);
    };

    // Handle dragging functionality
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const offsetX = Math.max(
                0,
                Math.min(e.clientX - rect.left, rect.width),
            );

            // Account for knob margins when calculating percentage
            const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
            const adjustedOffsetX = Math.max(
                knobRadius,
                Math.min(offsetX, rect.width - knobRadius),
            );
            const percentage =
                ((adjustedOffsetX - knobRadius) /
                    (rect.width - 2 * knobRadius)) *
                100;

            // Convert percentage to value (no rounding for smooth movement)
            const newValue = percentageToValue(percentage);

            // Ensure value is within min/max bounds
            const boundedValue = constrainValue(newValue);

            // Use smooth dragging (no rounding during drag)
            handleSmoothLeverageChange(boundedValue);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || !sliderRef.current || !e.touches[0]) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            const offsetX = Math.max(
                0,
                Math.min(touch.clientX - rect.left, rect.width),
            );

            // Account for knob margins when calculating percentage
            const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
            const adjustedOffsetX = Math.max(
                knobRadius,
                Math.min(offsetX, rect.width - knobRadius),
            );
            const percentage =
                ((adjustedOffsetX - knobRadius) /
                    (rect.width - 2 * knobRadius)) *
                100;

            // Convert percentage to value (no rounding for smooth movement)
            const newValue = percentageToValue(percentage);

            // Ensure value is within min/max bounds
            const boundedValue = constrainValue(newValue);

            // Use smooth dragging (no rounding during drag)
            handleSmoothLeverageChange(boundedValue);

            // Prevent scrolling while dragging
            e.preventDefault();
        };

        const handleMouseUp = () => {
            if (isDragging) {
                // Keep the exact value when dragging ends (no rounding/snapping)
                setPreferredLeverage(currentValue);
            }
            setIsDragging(false);
        };

        const handleTouchEnd = () => {
            if (isDragging) {
                // Keep the exact value when dragging ends (no rounding/snapping)
                setPreferredLeverage(currentValue);
            }
            setIsDragging(false);
        };

        if (isDragging) {
            // Mouse events
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Touch events
            document.addEventListener('touchmove', handleTouchMove, {
                passive: false,
            });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);
        }

        return () => {
            // Clean up event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging, minimumInputValue, maximumInputValue, currentValue]);

    const handleKnobMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue)) {
            // Ensure value is within min/max bounds but don't round
            const boundedValue = constrainValue(newValue);
            // Use the exact bounded value (no rounding)
            handleLeverageChange(boundedValue);
        } else {
            // If input is invalid, revert to current value
            setInputValue(formatValue(currentValue));
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    // Handle tick mark/label hover
    const handleTickHover = (tickIndex: number) => {
        setHoveredTickIndex(tickIndex);
        const tickValue = tickMarks[tickIndex];
        setHoverValue(tickValue);
        setIsHovering(true);
    };

    const handleTickLeave = () => {
        setHoveredTickIndex(null);
        setHoverValue(null);
        setIsHovering(false);
    };

    // Creates gradient string for the active part of the slider
    const createGradientString = (): string => {
        // fixed color positions
        return `linear-gradient(to right, 
            #26A69A 0%, 
            #89C374 25%, 
            #EBDF4E 50%, 
            #EE9A4F 75%, 
            #EF5350 100%)`;
    };

    return (
        <div
            className={`${styles.leverageSliderContainer} ${className} ${currentValue !== 1 ? styles.sliderContainerNotAtFirst : ''}`}
        >
            <h3 className={styles.containerTitle}>Leverage</h3>

            <div className={styles.sliderWithValue}>
                <div className={styles.sliderContainer}>
                    <div
                        ref={sliderRef}
                        className={styles.sliderTrack}
                        onClick={handleTrackClick}
                        onMouseMove={handleTrackMouseMove}
                        onMouseLeave={handleTrackMouseLeave}
                    >
                        {/* Dark background track */}
                        <div className={styles.sliderBackground}></div>

                        {/* Active colored portion - using fixed position gradient */}
                        <div
                            className={styles.sliderActive}
                            style={{
                                width: `${getKnobPosition()}%`,
                                background: createGradientString(),
                                backgroundSize: `${100 / (getKnobPosition() / 100)}% 100%`,
                                backgroundPosition: 'left center',
                            }}
                        ></div>

                        {/* Slider markers */}
                        {tickMarks.map((tickValue, index) => {
                            const position = valueToPercentage(tickValue);
                            const isActive = tickValue <= currentValue;
                            const isCurrent =
                                Math.abs(tickValue - value) <
                                SLIDER_CONFIG.CURRENT_VALUE_THRESHOLD;
                            // Only highlight if this specific tick is hovered OR if the hover value exactly matches this tick
                            const isHovered =
                                hoveredTickIndex === index ||
                                (hoverValue === tickValue && isHovering);
                            const tickColor = getColorAtPosition(position);

                            return (
                                <div
                                    key={index}
                                    className={`${styles.sliderMarker} ${
                                        isActive ? styles.active : ''
                                    } ${
                                        isCurrent
                                            ? styles.sliderMarkerCurrent
                                            : ''
                                    } ${
                                        isHovered
                                            ? styles.sliderMarkerHovered
                                            : ''
                                    }`}
                                    style={{
                                        left: `${position}%`,
                                        backgroundColor:
                                            isActive || isHovered
                                                ? tickColor
                                                : 'transparent',
                                        borderColor:
                                            isActive || isHovered
                                                ? 'transparent'
                                                : `rgba(255, 255, 255, ${UI_CONFIG.INACTIVE_TICK_OPACITY})`,
                                    }}
                                    onMouseEnter={() => handleTickHover(index)}
                                    onMouseLeave={handleTickLeave}
                                ></div>
                            );
                        })}

                        {/* Draggable knob */}
                        <div
                            ref={knobRef}
                            className={styles.sliderKnob}
                            style={{
                                left: `${getKnobPosition()}%`,
                                borderColor: getKnobColor(),
                                backgroundColor: 'transparent',
                            }}
                            onMouseDown={handleKnobMouseDown}
                            onTouchStart={handleKnobMouseDown}
                        ></div>
                    </div>

                    <div className={styles.labelContainer}>
                        {tickMarks.map((tickValue, index) => {
                            const position = valueToPercentage(tickValue);
                            const isActive = tickValue <= value;
                            // Only highlight if this specific tick is hovered OR if the hover value exactly matches this tick
                            const isHovered =
                                hoveredTickIndex === index ||
                                (hoverValue === tickValue && isHovering);
                            const tickColor = getColorAtPosition(position);

                            return (
                                <div
                                    key={index}
                                    className={`${styles.valueLabel} ${
                                        isHovered
                                            ? styles.valueLabelHovered
                                            : ''
                                    }`}
                                    style={{
                                        left: `${position}%`,
                                        color:
                                            isActive || isHovered
                                                ? tickColor
                                                : UI_CONFIG.INACTIVE_LABEL_COLOR,
                                    }}
                                    onClick={() =>
                                        handleLeverageChange(tickValue)
                                    }
                                    onMouseEnter={() => handleTickHover(index)}
                                    onMouseLeave={handleTickLeave}
                                >
                                    {formatLabelValue(tickValue)}x
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current value display with input */}
                <div className={styles.valueDisplay}>
                    <input
                        type='text'
                        value={
                            isDragging ? formatValue(currentValue) : inputValue
                        }
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className={styles.valueInput}
                        aria-label='Leverage value'
                        style={{
                            color: isDragging ? getKnobColor() : 'inherit',
                        }}
                        placeholder=''
                    />
                    <span className={styles.valueSuffix}>x</span>
                </div>
            </div>
        </div>
    );
}
