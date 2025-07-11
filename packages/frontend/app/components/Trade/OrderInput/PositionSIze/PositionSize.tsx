import React, { useEffect, useRef, useState } from 'react';
import styles from './PositionSize.module.css';

interface SizeOption {
    value: number;
    label: string;
}

interface PositionSizeProps {
    value: number;
    onChange: (value: number) => void;
    className?: string;
}

export default function PositionSize({
    value = 0,
    onChange,
    className = '',
}: PositionSizeProps) {
    // Visual markers and clickable positions
    const VISUAL_MARKERS: SizeOption[] = [
        { value: 0, label: '0%' },
        { value: 25, label: '25%' },
        { value: 50, label: '50%' },
        { value: 75, label: '75%' },
        { value: 100, label: '100%' },
    ];

    //  Drag increment step
    const DRAG_STEP = 5;

    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [showLabels] = useState(false);
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const sliderRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    // Helper function to get percentage from mouse position
    const getPercentageFromPosition = (clientX: number) => {
        if (!sliderRef.current) return 0;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        return (offsetX / rect.width) * 100;
    };

    // Handle dragging functionality
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !sliderRef.current) return;

            const percentage = getPercentageFromPosition(e.clientX);

            // Round to nearest DRAG_STEP increment
            const newValue = Math.round(percentage / DRAG_STEP) * DRAG_STEP;
            const clampedValue = Math.max(0, Math.min(100, newValue));

            // Update hover value during dragging for immediate visual feedback
            setHoverValue(clampedValue);

            if (clampedValue !== value) {
                onChange(clampedValue);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || !sliderRef.current || !e.touches[0]) return;

            const percentage = getPercentageFromPosition(e.touches[0].clientX);

            // Round to nearest DRAG_STEP increment
            const newValue = Math.round(percentage / DRAG_STEP) * DRAG_STEP;
            const clampedValue = Math.max(0, Math.min(100, newValue));

            // Update hover value during dragging for immediate visual feedback
            setHoverValue(clampedValue);

            if (clampedValue !== value) {
                onChange(clampedValue);
            }

            // Prevent scrolling while dragging
            e.preventDefault();
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setHoverValue(null); // Clear hover value when dragging ends
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
            setHoverValue(null); // Clear hover value when dragging ends
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
            // Clean up all event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging, value, onChange, DRAG_STEP]);

    const handleKnobMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleTrackMouseMove = (e: React.MouseEvent) => {
        if (!sliderRef.current || isDragging) return;

        const percentage = getPercentageFromPosition(e.clientX);

        // Round to nearest 5% increment for display
        const roundedPercentage =
            Math.round(percentage / DRAG_STEP) * DRAG_STEP;
        const clampedPercentage = Math.max(0, Math.min(100, roundedPercentage));

        setHoverValue(clampedPercentage);
    };

    const handleTrackMouseLeave = () => {
        setHoverValue(null);
    };

    const handleTrackClick = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;

        const percentage = getPercentageFromPosition(e.clientX);

        // For track clicks, snap to visual markers if we're close to them (within 7.5%)
        const closestMarker = VISUAL_MARKERS.reduce((prev, curr) =>
            Math.abs(curr.value - percentage) <
            Math.abs(prev.value - percentage)
                ? curr
                : prev,
        );

        // Increase snap tolerance to 7.5% to make it easier to hit markers
        const distanceToMarker = Math.abs(closestMarker.value - percentage);
        if (distanceToMarker <= 7.5) {
            onChange(closestMarker.value);
        } else {
            // Round to nearest 5% increment
            const newValue = Math.round(percentage / DRAG_STEP) * DRAG_STEP;
            const clampedValue = Math.max(0, Math.min(100, newValue));
            onChange(clampedValue);
        }
    };

    // Get position for the knob as percentage
    const getKnobPosition = () => {
        return value; // Direct percentage positioning
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Handle input blur (when user finishes typing)
    const handleInputBlur = () => {
        const newValue = parseInt(inputValue, 10);
        if (!isNaN(newValue)) {
            // Round to nearest DRAG_STEP and clamp between 0-100
            const roundedValue = Math.round(newValue / DRAG_STEP) * DRAG_STEP;
            const clampedValue = Math.max(0, Math.min(100, roundedValue));
            onChange(clampedValue);
        } else {
            // Reset to current value if invalid
            setInputValue(value.toString());
        }
    };

    // Handle Enter key in input
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className={`${styles.positionSliderContainer} ${className}`}>
            <div className={styles.sliderWithValue}>
                <div className={styles.sliderContainer}>
                    <div
                        ref={sliderRef}
                        className={styles.sliderTrack}
                        onClick={handleTrackClick}
                        onMouseMove={handleTrackMouseMove}
                        onMouseLeave={handleTrackMouseLeave}
                    >
                        {/* Gray background track */}
                        <div className={styles.sliderBackground}></div>

                        {/* Colored active track */}
                        <div
                            className={styles.sliderActive}
                            style={{
                                width: `${getKnobPosition()}%`,
                                // background: `linear-gradient(to right, ${colors['1']}, ${colors['5']}, ${colors['10']}, ${colors['50']}, ${colors['100']})`
                            }}
                        ></div>

                        {/* Slider markers - only show visual markers */}
                        {VISUAL_MARKERS.map((marker: SizeOption) => (
                            <div
                                key={marker.value}
                                className={`${styles.sliderMarker} ${
                                    marker.value <= value ? styles.active : ''
                                } ${
                                    marker.value === value
                                        ? styles.sliderMarkerCurrent
                                        : ''
                                }`}
                                style={{
                                    left: `${marker.value}%`,
                                    borderColor:
                                        marker.value <= value
                                            ? 'transparent'
                                            : 'var(--accent1)',
                                }}
                            ></div>
                        ))}

                        {/* Draggable knob */}
                        <div
                            ref={knobRef}
                            className={styles.sliderKnob}
                            style={{
                                left: `${getKnobPosition()}%`,
                                // borderColor: getKnobColor(),
                            }}
                            onMouseDown={handleKnobMouseDown}
                            onTouchStart={handleKnobMouseDown}
                        ></div>
                    </div>

                    {showLabels && (
                        <div className={styles.labelContainer}>
                            {VISUAL_MARKERS.map((marker: SizeOption) => (
                                <div
                                    key={marker.value}
                                    className={styles.valueLabel}
                                    style={{
                                        left: `${marker.value}%`,
                                        color:
                                            marker.value <= value
                                                ? '#FFFFFF'
                                                : '#808080',
                                    }}
                                    onClick={() => onChange(marker.value)}
                                >
                                    {marker.label}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Current value display with input */}
                <div className={styles.valueDisplay}>
                    <input
                        type='text'
                        value={
                            hoverValue !== null
                                ? hoverValue.toString()
                                : inputValue
                        }
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className={styles.valueInput}
                        aria-label='Leverage value'
                        style={{
                            color:
                                hoverValue !== null
                                    ? 'var(--accent1)'
                                    : 'var(--text1)',
                        }}
                    />
                    <span
                        className={styles.valueSuffix}
                        style={{
                            color: 'var(--text1)',
                        }}
                    >
                        %
                    </span>
                </div>
            </div>
        </div>
    );
}
