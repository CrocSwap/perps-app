import React, { useEffect, useRef, useState } from 'react';
import styles from './LeverageSlider.module.css';

interface LeverageSliderProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
    minimumInputValue?: number;
    maximumInputValue?: number;
    generateRandomMaximumInput: () => void;
}

export default function LeverageSlider({
    value = 1,
    onChange,
    className = '',
    minimumInputValue = 1,
    maximumInputValue = 100,
}: LeverageSliderProps) {
    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [tickMarks, setTickMarks] = useState<number[]>([]);
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const [isHovering, setIsHovering] = useState<boolean>(false);

    const sliderRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    // Generate logarithmically distributed tick marks
    useEffect(() => {
        // Check for valid inputs
        if (
            !isNaN(minimumInputValue) &&
            !isNaN(maximumInputValue) &&
            minimumInputValue > 0 &&
            maximumInputValue > minimumInputValue
        ) {
            const generateLogarithmicTicks = (
                min: number,
                max: number,
                count: number,
            ): number[] => {
                // Safety check for minimum value to prevent log(0)
                const safeMin = Math.max(0.1, min);

                // Use logarithmic scale to distribute the ticks
                const minLog = Math.log(safeMin);
                const maxLog = Math.log(max);
                const ticks = [];

                // Always include min and max
                ticks.push(min);

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
                if (ticks[ticks.length - 1] !== max) {
                    ticks.push(max);
                }

                return ticks;
            };

            // Generate 5-7 ticks depending on the range
            const tickCount = maximumInputValue > 100 ? 7 : 5;
            const ticks = generateLogarithmicTicks(
                minimumInputValue,
                maximumInputValue,
                tickCount,
            );
            setTickMarks(ticks);
        }
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
        const safeMin = Math.max(0.1, minimumInputValue);

        try {
            // Convert to logarithmic scale for smoother distribution
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

    // Convert percentage position to value
    const percentageToValue = (percentage: number): number => {
        if (minimumInputValue <= 0 || maximumInputValue <= minimumInputValue)
            return minimumInputValue;

        // Bound the percentage between 0 and 100
        const boundedPercentage = Math.max(0, Math.min(100, percentage));
        const safeMin = Math.max(0.1, minimumInputValue);

        // Convert from percentage to logarithmic value
        const minLog = Math.log(safeMin);
        const maxLog = Math.log(maximumInputValue);
        const valueLog = minLog + (boundedPercentage / 100) * (maxLog - minLog);

        return Math.exp(valueLog);
    };

    // Get position for the knob as percentage
    const getKnobPosition = (): number => {
        if (isNaN(value)) {
            return 0;
        }
        return valueToPercentage(value);
    };

    // Get color based on position
    const getColorAtPosition = (position: number): string => {
        const colorStops = [
            { position: 0, color: '#26A69A' }, // teal
            { position: 25, color: '#89C374' }, // green
            { position: 50, color: '#EBDF4E' }, // yellow
            { position: 75, color: '#EE9A4F' }, // orange
            { position: 100, color: '#EF5350' }, // red
        ];

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
        const percentage = (offsetX / rect.width) * 100;

        // Convert percentage to value (logarithmic)
        const newValue = percentageToValue(percentage);

        // Round to whole number
        const roundedValue = Math.round(newValue);

        // Ensure value is within min/max bounds
        const boundedValue = Math.max(
            minimumInputValue,
            Math.min(maximumInputValue, roundedValue),
        );

        setHoverValue(boundedValue);
        setIsHovering(true);
    };

    // Handle mouse leave from track
    const handleTrackMouseLeave = () => {
        setIsHovering(false);
        setHoverValue(null);
    };

    // Handle track click to set value
    const handleTrackClick = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(
            0,
            Math.min(e.clientX - rect.left, rect.width),
        );
        const percentage = (offsetX / rect.width) * 100;

        // Convert percentage to value (logarithmic)
        const newValue = percentageToValue(percentage);

        // Round to whole number
        const roundedValue = Math.round(newValue);

        // Ensure value is within min/max bounds
        const boundedValue = Math.max(
            minimumInputValue,
            Math.min(maximumInputValue, roundedValue),
        );

        onChange(boundedValue);
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
            const percentage = (offsetX / rect.width) * 100;

            // Convert percentage to value (logarithmic)
            const newValue = percentageToValue(percentage);

            // Round to whole number
            const roundedValue = Math.round(newValue);

            // Ensure value is within min/max bounds
            const boundedValue = Math.max(
                minimumInputValue,
                Math.min(maximumInputValue, roundedValue),
            );

            onChange(boundedValue);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || !sliderRef.current || !e.touches[0]) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            const offsetX = Math.max(
                0,
                Math.min(touch.clientX - rect.left, rect.width),
            );
            const percentage = (offsetX / rect.width) * 100;

            // Convert percentage to value (logarithmic)
            const newValue = percentageToValue(percentage);

            // Round to 1 decimal place for cleaner values
            const roundedValue = Math.round(newValue * 10) / 10;

            // Ensure value is within min/max bounds
            const boundedValue = Math.max(
                minimumInputValue,
                Math.min(maximumInputValue, roundedValue),
            );

            onChange(boundedValue);

            // Prevent scrolling while dragging
            e.preventDefault();
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        const handleTouchEnd = () => {
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
            // Clean up  event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging, minimumInputValue, maximumInputValue, onChange]);

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
            // Round to whole number
            const roundedValue = Math.round(newValue);

            // Ensure value is within min/max bounds
            const boundedValue = Math.max(
                minimumInputValue,
                Math.min(maximumInputValue, roundedValue),
            );
            onChange(boundedValue);
        } else {
            setInputValue(value.toString());
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
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
        <div className={`${styles.leverageSliderContainer} ${className}`}>
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
                            const isActive = tickValue <= value;
                            const isCurrent = Math.abs(tickValue - value) < 0.1;

                            return (
                                <div
                                    key={index}
                                    className={`${styles.sliderMarker} ${
                                        isActive ? styles.active : ''
                                    } ${
                                        isCurrent
                                            ? styles.sliderMarkerCurrent
                                            : ''
                                    }`}
                                    style={{
                                        left: `${position}%`,
                                        backgroundColor: isActive
                                            ? getColorAtPosition(
                                                  (index /
                                                      (tickMarks.length - 1)) *
                                                      100,
                                              )
                                            : 'transparent',
                                        borderColor: isActive
                                            ? 'transparent'
                                            : 'rgba(255, 255, 255, 0.3)',
                                    }}
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

                            return (
                                <div
                                    key={index}
                                    className={styles.valueLabel}
                                    style={{
                                        left: `${position}%`,
                                        color: isActive ? '#FFFFFF' : '#808080',
                                    }}
                                    onClick={() => onChange(tickValue)}
                                >
                                    {tickValue}x
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
                            isDragging
                                ? value.toString()
                                : isHovering && hoverValue !== null
                                  ? hoverValue.toString()
                                  : isNaN(parseFloat(inputValue))
                                    ? '0'
                                    : inputValue
                        }
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className={styles.valueInput}
                        aria-label='Leverage value'
                        style={{
                            color:
                                isDragging ||
                                (isHovering && hoverValue !== null)
                                    ? 'var(--accent1)'
                                    : 'var(--text1)',
                        }}
                    />
                    <span className={styles.valueSuffix}>x</span>
                </div>
            </div>
        </div>
    );
}
