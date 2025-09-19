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
    hideValueDisplay?: boolean;
    isModal?: boolean;
}

const POSITION_SIZE_CONFIG = {
    // Minimum and maximum values
    MIN_VALUE: 0,
    MAX_VALUE: 100,

    // Snap tolerance for clicking near markers (percentage)
    MARKER_SNAP_TOLERANCE: 0.5,

    // Visual markers for the slider
    VISUAL_MARKERS: [
        { value: 0, label: '0%' },
        { value: 25, label: '25%' },
        { value: 50, label: '50%' },
        { value: 75, label: '75%' },
        { value: 100, label: '100%' },
    ],
} as const;

const POSITION_SIZE_UI_CONFIG = {
    // Color values
    ACTIVE_LABEL_COLOR: '#FFFFFF',
    INACTIVE_LABEL_COLOR: '#808080',
    TEXT_COLOR: 'var(--text1)',
    ACCENT_COLOR: 'var(--accent1)',

    // Default show labels state
    DEFAULT_SHOW_LABELS: false,
} as const;

export default function PositionSize({
    value = 0,
    onChange,
    className = '',
    hideValueDisplay = false,
    isModal = false,
}: PositionSizeProps) {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [showLabels] = useState(POSITION_SIZE_UI_CONFIG.DEFAULT_SHOW_LABELS);
    const [currentValue, setCurrentValue] = useState<number>(Math.floor(value));

    const sliderRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const currentValueRef = useRef<number>(currentValue);
    useEffect(() => {
        currentValueRef.current = currentValue;
    }, [currentValue]);

    // Update internal value when prop changes (but not during drag)
    useEffect(() => {
        if (!isDragging) {
            setCurrentValue(Math.floor(value));
        }
    }, [value, isDragging]);

    // Get percentage from mouse position
    const getPercentageFromPosition = (clientX: number) => {
        if (!sliderRef.current) return 0;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (offsetX / rect.width) * 100;

        // Always round down to nearest integer
        return Math.floor(percentage);
    };

    // Handle dragging functionality
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !sliderRef.current) return;

            const percentage = getPercentageFromPosition(e.clientX);

            // Clamp to min/max
            const clampedValue = Math.floor(
                Math.max(
                    POSITION_SIZE_CONFIG.MIN_VALUE,
                    Math.min(POSITION_SIZE_CONFIG.MAX_VALUE, percentage),
                ),
            );

            // Update internal value immediately for smooth visual feedback
            setCurrentValue(clampedValue);
            onChange(clampedValue);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || !sliderRef.current || !e.touches[0]) return;

            const percentage = getPercentageFromPosition(e.touches[0].clientX);

            // Clamp to min/max
            const clampedValue = Math.max(
                POSITION_SIZE_CONFIG.MIN_VALUE,
                Math.min(POSITION_SIZE_CONFIG.MAX_VALUE, percentage),
            );

            setCurrentValue(clampedValue);
            onChange(clampedValue);

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
            // Clean up all event listeners
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging]);

    const handleKnobMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        (e.target as HTMLElement).focus();
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleTrackClick = (e: React.MouseEvent) => {
        const percentage = getPercentageFromPosition(e.clientX);

        let snappedValue = percentage;

        // Check for marker snapping
        POSITION_SIZE_CONFIG.VISUAL_MARKERS.forEach((marker) => {
            const distance = Math.abs(marker.value - percentage);
            if (distance <= POSITION_SIZE_CONFIG.MARKER_SNAP_TOLERANCE) {
                snappedValue = marker.value;
            }
        });

        snappedValue = Math.min(
            POSITION_SIZE_CONFIG.MAX_VALUE,
            Math.max(POSITION_SIZE_CONFIG.MIN_VALUE, snappedValue),
        );

        setCurrentValue(snappedValue);
        onChange(snappedValue);
    };
    const handleTrackTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest(`.${styles.sliderKnob}`)) {
            return;
        }

        if (!e.touches[0]) return;

        // Get the percentage directly from touch position
        const percentage = getPercentageFromPosition(e.touches[0].clientX);

        let snappedValue = percentage;

        // Check for marker snapping (same logic as handleTrackClick)
        POSITION_SIZE_CONFIG.VISUAL_MARKERS.forEach((marker) => {
            const distance = Math.abs(marker.value - percentage);
            if (distance <= POSITION_SIZE_CONFIG.MARKER_SNAP_TOLERANCE) {
                snappedValue = marker.value;
            }
        });

        snappedValue = Math.min(
            POSITION_SIZE_CONFIG.MAX_VALUE,
            Math.max(POSITION_SIZE_CONFIG.MIN_VALUE, snappedValue),
        );

        setCurrentValue(snappedValue);
        onChange(snappedValue);
        setIsDragging(true);
        e.preventDefault();
    };
    const handleTrackMouseDown = (e: React.MouseEvent) => {
        // Don't interfere if clicking on the knob
        if ((e.target as HTMLElement).closest(`.${styles.sliderKnob}`)) {
            return;
        }

        // Handle the click first
        handleTrackClick(e);

        setIsDragging(true);
        e.preventDefault();
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^\d]/g, ''); // Remove non-numeric
        const newValue = parseInt(rawValue);

        // Stop if empty or invalid
        if (isNaN(newValue)) {
            setCurrentValue(0); // Reset
            onChange(0);
            return;
        }

        // Clamp & update
        const clampedValue = Math.floor(
            Math.max(
                POSITION_SIZE_CONFIG.MIN_VALUE,
                Math.min(POSITION_SIZE_CONFIG.MAX_VALUE, newValue),
            ),
        );

        setCurrentValue(clampedValue);
        onChange(clampedValue);
    };

    // Handle input blur (when user finishes typing)
    const handleInputBlur = () => {
        // Value is already updated in onChange, I am only leaving this here for calculations we will be doing later
    };

    // Handle Enter key in input
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        let newValue = currentValue;
        const step = 5; // 5% increments

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                newValue = Math.min(
                    POSITION_SIZE_CONFIG.MAX_VALUE,
                    currentValue + step,
                );
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                newValue = Math.max(
                    POSITION_SIZE_CONFIG.MIN_VALUE,
                    currentValue - step,
                );
                break;
            case 'Home':
                newValue = POSITION_SIZE_CONFIG.MIN_VALUE;
                break;
            case 'End':
                newValue = POSITION_SIZE_CONFIG.MAX_VALUE;
                break;
            default:
                return;
        }

        e.preventDefault();
        setCurrentValue(newValue);
        onChange(newValue);
    };

    return (
        <div
            className={`${styles.positionSliderContainer} ${className} ${isModal && styles.modalContainer} `}
        >
            <div className={styles.sliderWithValue}>
                <div className={styles.sliderContainer}>
                    <div
                        ref={sliderRef}
                        className={styles.sliderTrack}
                        role='slider'
                        tabIndex={0}
                        aria-label='Position size percentage'
                        aria-valuemin={POSITION_SIZE_CONFIG.MIN_VALUE}
                        aria-valuemax={POSITION_SIZE_CONFIG.MAX_VALUE}
                        aria-valuenow={currentValue}
                        aria-orientation='horizontal'
                        onKeyDown={handleKeyDown}
                        onMouseDown={handleTrackMouseDown}
                        onTouchStart={handleTrackTouchStart}
                    >
                        {/* Gray background track */}
                        <div className={styles.sliderBackground}></div>

                        {/* Colored active track */}
                        <div
                            className={styles.sliderActive}
                            style={{
                                width: `${currentValue}%`,
                                transition: isDragging ? 'none' : undefined,
                            }}
                        ></div>

                        {/* Slider markers */}
                        {POSITION_SIZE_CONFIG.VISUAL_MARKERS.map(
                            (marker: SizeOption) => (
                                <div
                                    key={marker.value}
                                    className={`${styles.sliderMarker} ${
                                        marker.value <= currentValue
                                            ? styles.active
                                            : ''
                                    }`}
                                    style={{
                                        left: `${marker.value}%`,
                                        borderColor:
                                            marker.value <= currentValue
                                                ? 'transparent'
                                                : POSITION_SIZE_UI_CONFIG.ACCENT_COLOR,
                                    }}
                                ></div>
                            ),
                        )}

                        {/* Draggable knob */}
                        <div
                            // tabIndex={-1}
                            ref={knobRef}
                            className={styles.sliderKnob}
                            style={{
                                left: `${currentValue}%`,
                                transition: isDragging ? 'none' : undefined,
                            }}
                            onMouseDown={handleKnobMouseDown}
                            onTouchStart={handleKnobMouseDown}
                        ></div>
                    </div>

                    {showLabels && (
                        <div className={styles.labelContainer}>
                            {POSITION_SIZE_CONFIG.VISUAL_MARKERS.map(
                                (marker: SizeOption) => (
                                    <div
                                        key={marker.value}
                                        className={styles.valueLabel}
                                        style={{
                                            left: `${marker.value}%`,
                                            color:
                                                marker.value <= currentValue
                                                    ? POSITION_SIZE_UI_CONFIG.ACTIVE_LABEL_COLOR
                                                    : POSITION_SIZE_UI_CONFIG.INACTIVE_LABEL_COLOR,
                                        }}
                                        onClick={() => {
                                            setCurrentValue(marker.value);
                                            onChange(marker.value);
                                        }}
                                    >
                                        {marker.label}
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>

                {/* Current value display with input  */}
                {!hideValueDisplay && (
                    <div
                        className={`${styles.valueDisplay} ${isModal && styles.modalValueDisplay}`}
                    >
                        <input
                            type='text'
                            inputMode='numeric'
                            pattern='[0-9]*'
                            value={
                                Number.isNaN(currentValue) ? '' : currentValue
                            }
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleInputKeyDown}
                            className={styles.valueInput}
                            aria-label='Position size value'
                            style={{
                                color: POSITION_SIZE_UI_CONFIG.TEXT_COLOR,
                            }}
                            autoComplete='off'
                            spellCheck={false}
                        />
                        <span
                            className={styles.valueSuffix}
                            style={{
                                color: POSITION_SIZE_UI_CONFIG.TEXT_COLOR,
                            }}
                        >
                            %
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
