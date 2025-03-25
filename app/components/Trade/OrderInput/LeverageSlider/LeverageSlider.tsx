import React, { useState, useEffect, useRef } from 'react';
import styles from './LeverageSlider.module.css';

interface LeverageOption {
    value: number;
    label: string;
}

interface LeverageSliderProps {
    options: LeverageOption[];
    value: number;
    onChange: (value: number) => void;
    className?: string;
}

export default function LeverageSlider({
    options = [
        { value: 1, label: '1x' },
        { value: 5, label: '5x' },
        { value: 10, label: '10x' },
        { value: 50, label: '50x' },
        { value: 100, label: '100x' },
    ],
    value = 1,
    onChange,
    className = '',
}: LeverageSliderProps) {
    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const sliderRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    // Find the selected option index
    const selectedIndex = options.findIndex((option) => option.value === value);

    // Color ranges for the gradient
    const colors: Record<string, string> = {
        '1': '#26A69A', // teal
        '5': '#66BB6A', // green
        '10': '#EBDF4E', // yellow
        '50': '#EF9350', // orange
        '100': '#EF5350', // red
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
            const percentage = offsetX / rect.width;

            // Find the closest option based on drag position
            const position = percentage * (options.length - 1);
            const lowerIndex = Math.floor(position);
            const upperIndex = Math.ceil(position);

            // Determine which one is closer
            let newIndex;
            if (upperIndex >= options.length) {
                newIndex = options.length - 1;
            } else if (lowerIndex < 0) {
                newIndex = 0;
            } else {
                const lowerDiff = Math.abs(position - lowerIndex);
                const upperDiff = Math.abs(upperIndex - position);
                newIndex = lowerDiff <= upperDiff ? lowerIndex : upperIndex;
            }

            const newValue = options[newIndex].value;
            if (newValue !== value) {
                onChange(newValue);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || !sliderRef.current || !e.touches[0]) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            const offsetX = Math.max(
                0,
                Math.min(touch.clientX - rect.left, rect.width),
            );
            const percentage = offsetX / rect.width;

            // Find the closest option based on touch position
            const position = percentage * (options.length - 1);
            const lowerIndex = Math.floor(position);
            const upperIndex = Math.ceil(position);

            // Determine which one is closer
            let newIndex;
            if (upperIndex >= options.length) {
                newIndex = options.length - 1;
            } else if (lowerIndex < 0) {
                newIndex = 0;
            } else {
                const lowerDiff = Math.abs(position - lowerIndex);
                const upperDiff = Math.abs(upperIndex - position);
                newIndex = lowerDiff <= upperDiff ? lowerIndex : upperIndex;
            }

            const newValue = options[newIndex].value;
            if (newValue !== value) {
                onChange(newValue);
            }

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
    }, [isDragging, options, value, onChange]);

    const handleKnobMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleTrackClick = (e: React.MouseEvent) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percentage = offsetX / rect.width;

        // Find the closest option based on click position
        const position = percentage * (options.length - 1);
        const lowerIndex = Math.floor(position);
        const upperIndex = Math.ceil(position);

        // Determine which one is closer
        let newIndex;
        if (upperIndex >= options.length) {
            newIndex = options.length - 1;
        } else if (lowerIndex < 0) {
            newIndex = 0;
        } else {
            const lowerDiff = Math.abs(position - lowerIndex);
            const upperDiff = Math.abs(upperIndex - position);
            newIndex = lowerDiff <= upperDiff ? lowerIndex : upperIndex;
        }

        onChange(options[newIndex].value);
    };

    // Get position for the knob as percentage
    const getKnobPosition = () => {
        return selectedIndex === -1
            ? 0
            : (selectedIndex / (options.length - 1)) * 100;
    };

    // Get color for the knob based on value
    const getKnobColor = () => {
        return colors[value.toString()] || colors['100'];
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Handle input blur (when user finishes typing)
    const handleInputBlur = () => {
        const newValue = parseInt(inputValue, 10);
        if (!isNaN(newValue)) {
            // Find the closest valid option
            const closestOption = options.reduce((prev, curr) =>
                Math.abs(curr.value - newValue) <
                Math.abs(prev.value - newValue)
                    ? curr
                    : prev,
            );
            onChange(closestOption.value);
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
        <div className={`${styles.leverageSliderContainer} ${className}`}>
            <h3 className={styles.containerTitle}>Leverage</h3>
            <div className={styles.sliderWithValue}>
                <div className={styles.sliderContainer}>
                    <div
                        ref={sliderRef}
                        className={styles.sliderTrack}
                        onClick={handleTrackClick}
                    >
                        {/* Gray background track */}
                        <div className={styles.sliderBackground}></div>

                        {/* Colored active track */}
                        <div
                            className={styles.sliderActive}
                            style={{
                                width: `${getKnobPosition()}%`,
                                background: `linear-gradient(to right, ${colors['1']}, ${colors['5']}, ${colors['10']}, ${colors['50']}, ${colors['100']})`,
                            }}
                        ></div>

                        {/* Slider markers */}
                        {options.map((option, index) => (
                            <div
                                key={option.value}
                                className={`${styles.sliderMarker} ${
                                    index <= selectedIndex ? styles.active : ''
                                } ${
                                    index === selectedIndex
                                        ? styles.sliderMarkerCurrent
                                        : ''
                                }`}
                                style={{
                                    left: `${
                                        (index / (options.length - 1)) * 100
                                    }%`,
                                    backgroundColor:
                                        index <= selectedIndex
                                            ? colors[option.value.toString()] ||
                                              '#FFFFFF'
                                            : 'transparent',
                                    borderColor:
                                        index <= selectedIndex
                                            ? 'transparent'
                                            : 'rgba(255, 255, 255, 0.3)',
                                }}
                            ></div>
                        ))}

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
                        {options.map((option, index) => (
                            <div
                                key={option.value}
                                className={styles.valueLabel}
                                style={{
                                    left: `${
                                        (index / (options.length - 1)) * 100
                                    }%`,
                                    color:
                                        index <= selectedIndex
                                            ? '#FFFFFF'
                                            : '#808080',
                                }}
                                onClick={() => onChange(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Current value display with input */}
                <div className={styles.valueDisplay}>
                    <input
                        type='text'
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className={styles.valueInput}
                        aria-label='Leverage value'
                    />
                    <span className={styles.valueSuffix}>x</span>
                </div>
            </div>
        </div>
    );
}
