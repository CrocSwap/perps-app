import React from 'react';
import styles from './LeverageSlider.module.css';

interface SliderTrackProps {
    sliderRef: React.RefObject<HTMLDivElement | null>;
    knobRef: React.RefObject<HTMLDivElement | null>;
    currentValue: number;
    value: number;
    minimumInputValue: number;
    maximumInputValue: number;
    minimumValue?: number;
    tickMarks: number[];
    hoveredTickIndex: number | null;
    hoverValue: number | null;
    isHovering: boolean;
    knobPosition: number;
    minimumPercentage: number;
    gradientString: string;
    knobColor: string;
    onClick?: (newLeverage: number) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onTrackMouseDown: (e: React.MouseEvent) => void;
    onTrackTouchStart: (e: React.TouchEvent) => void;
    onTrackMouseMove: (e: React.MouseEvent) => void;
    onTrackMouseLeave: () => void;
    onKnobMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
    onTickHover: (index: number) => void;
    onTickLeave: () => void;
    onLeverageChange: (value: number) => void;
    valueToPercentage: (val: number) => number;
    getColorAtPosition: (position: number) => string;
    formatLabelValue: (val: number) => string;
    shouldShowMinimumConstraints: boolean;
    onMinimumLabelEnter?: () => void;
    onMinimumLabelLeave?: () => void;
    setSliderBelowMinimumLeverage?: (value: boolean) => void;
}

const SLIDER_CONFIG = {
    CURRENT_VALUE_THRESHOLD: 0.1,
} as const;

const UI_CONFIG = {
    INACTIVE_TICK_OPACITY: 0.3,
} as const;

export default function SliderTrack({
    sliderRef,
    knobRef,
    currentValue,
    value,
    minimumInputValue,
    maximumInputValue,
    minimumValue,
    tickMarks,
    hoveredTickIndex,
    hoverValue,
    isHovering,
    knobPosition,
    minimumPercentage,
    gradientString,
    knobColor,
    onClick,
    onKeyDown,
    onTrackMouseDown,
    onTrackTouchStart,
    onTrackMouseMove,
    onTrackMouseLeave,
    onKnobMouseDown,
    onTickHover,
    onTickLeave,
    onLeverageChange,
    valueToPercentage,
    getColorAtPosition,
    formatLabelValue,
    shouldShowMinimumConstraints,
    setSliderBelowMinimumLeverage,
}: SliderTrackProps) {
    const isTickInGreyedArea = (tickValue: number): boolean => {
        return shouldShowMinimumConstraints && tickValue < minimumValue!;
    };
    return (
        <>
            <div
                ref={sliderRef}
                className={styles.sliderTrack}
                role='slider'
                tabIndex={0}
                aria-label='Leverage amount'
                aria-valuemin={minimumInputValue}
                aria-valuemax={maximumInputValue}
                aria-valuenow={
                    isNaN(currentValue) ||
                    currentValue === null ||
                    currentValue === undefined
                        ? minimumInputValue
                        : Math.max(
                              minimumInputValue,
                              Math.min(
                                  maximumInputValue,
                                  Math.round(currentValue * 10) / 10,
                              ),
                          )
                }
                aria-orientation='horizontal'
                onKeyDown={onKeyDown}
                onMouseDown={onTrackMouseDown}
                onTouchStart={onTrackTouchStart}
                onMouseMove={onTrackMouseMove}
                onMouseLeave={onTrackMouseLeave}
                aria-valuetext={`${
                    isNaN(currentValue) ||
                    currentValue === null ||
                    currentValue === undefined
                        ? minimumInputValue
                        : Math.max(
                              minimumInputValue,
                              Math.min(
                                  maximumInputValue,
                                  Math.round(currentValue * 10) / 10,
                              ),
                          )
                }x leverage`}
            >
                <div
                    className={styles.sliderBackground}
                    role='none'
                    aria-hidden='true'
                ></div>

                {/* Greyed out minimum section */}
                {shouldShowMinimumConstraints && (
                    <>
                        <div
                            className={styles.sliderGreyedOut}
                            style={{
                                width: `${minimumPercentage}%`,
                            }}
                            // onMouseEnter={() =>
                            //     setSliderBelowMinimumLeverage?.(true)
                            // }
                            // onMouseLeave={() =>
                            //     setSliderBelowMinimumLeverage?.(false)
                            // }
                        ></div>

                        <div
                            className={styles.minimumIndicator}
                            style={{
                                left: `${minimumPercentage}%`,
                            }}
                            // onMouseEnter={() =>
                            //     setSliderBelowMinimumLeverage?.(true)
                            // }
                            // onMouseLeave={() =>
                            //     setSliderBelowMinimumLeverage?.(false)
                            // }
                        ></div>

                        {minimumValue && (
                            <div
                                className={styles.minimumLabel}
                                style={{
                                    left:
                                        minimumValue < 3.5
                                            ? 0
                                            : `${minimumPercentage}%`,
                                    transform:
                                        minimumValue < 3.5
                                            ? 'none'
                                            : 'translateX(-130%)',
                                }}
                                onMouseEnter={() =>
                                    setSliderBelowMinimumLeverage?.(true)
                                }
                                onMouseLeave={() =>
                                    setSliderBelowMinimumLeverage?.(false)
                                }
                            >
                                Min:{' '}
                                {minimumValue < 3
                                    ? `${minimumValue.toFixed(1)}x`
                                    : `${Math.trunc(minimumValue)}x`}{' '}
                            </div>
                        )}
                    </>
                )}

                <div
                    className={styles.sliderActive}
                    style={{
                        width: `${knobPosition}%`,
                        background: gradientString,
                        backgroundSize:
                            knobPosition > 0
                                ? `${100 / (knobPosition / 100)}% 100%`
                                : '100% 100%',
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
                    const isHovered =
                        hoveredTickIndex === index ||
                        (hoverValue === tickValue && isHovering);
                    const tickColor = getColorAtPosition(position);

                    const isInGreyedArea = isTickInGreyedArea(tickValue);

                    return (
                        <div
                            key={index}
                            role='button'
                            tabIndex={0}
                            aria-label={`Set leverage to ${formatLabelValue(tickValue)}x`}
                            className={`${styles.sliderMarker} ${
                                isActive ? styles.active : ''
                            } ${isCurrent ? styles.sliderMarkerCurrent : ''} ${
                                isHovered ? styles.sliderMarkerHovered : ''
                            }`}
                            style={{
                                left: `${position}%`,
                                backgroundColor: isInGreyedArea
                                    ? '#2b2a2f'
                                    : isActive || isHovered
                                      ? tickColor
                                      : 'transparent',
                                borderColor: isInGreyedArea
                                    ? '#2b2a2f'
                                    : isActive || isHovered
                                      ? 'transparent'
                                      : `rgba(255, 255, 255, ${UI_CONFIG.INACTIVE_TICK_OPACITY})`,
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onLeverageChange(tickValue);
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClick) {
                                    onClick(
                                        Math.max(tickValue, minimumValue || 1),
                                    );
                                } else {
                                    onLeverageChange(tickValue);
                                }
                            }}
                            onMouseEnter={() => onTickHover(index)}
                            onMouseLeave={onTickLeave}
                        ></div>
                    );
                })}

                {/* Draggable knob */}
                <div
                    ref={knobRef}
                    className={styles.sliderKnob}
                    style={{
                        left: `${knobPosition}%`,
                        borderColor: knobColor,
                        backgroundColor: 'transparent',
                    }}
                    onMouseDown={onKnobMouseDown}
                    onTouchStart={onKnobMouseDown}
                ></div>
            </div>

            {/* Labels */}
            <div className={styles.labelContainer}>
                {tickMarks.map((tickValue, index) => {
                    const position = valueToPercentage(tickValue);
                    const isActive = tickValue <= value;
                    const isHovered =
                        hoveredTickIndex === index ||
                        (hoverValue === tickValue && isHovering);
                    const tickColor = getColorAtPosition(position);

                    const isInGreyedArea = isTickInGreyedArea(tickValue);

                    return (
                        <div
                            key={index}
                            role='button'
                            tabIndex={0}
                            aria-label={`Set leverage to ${formatLabelValue(tickValue)}x`}
                            className={`${styles.valueLabel} ${
                                isHovered ? styles.valueLabelHovered : ''
                            }`}
                            style={{
                                left: `${position}%`,
                                color: isInGreyedArea
                                    ? 'rgba(128, 128, 128, 0.6)'
                                    : isActive || isHovered
                                      ? tickColor
                                      : 'var(--text1)',
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onLeverageChange(tickValue);
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClick) {
                                    onClick(
                                        Math.max(tickValue, minimumValue || 1),
                                    );
                                } else {
                                    onLeverageChange(tickValue);
                                }
                            }}
                            onMouseEnter={() => {
                                if (isInGreyedArea) {
                                    return;
                                    // Show warning for greyed out labels
                                    // setSliderBelowMinimumLeverage?.(true);
                                } else {
                                    // Normal hover behavior for non-greyed labels
                                    onTickHover(index);
                                }
                            }}
                            onMouseLeave={() => {
                                if (isInGreyedArea) {
                                    return;
                                    // Hide warning for greyed out labels
                                    // setSliderBelowMinimumLeverage?.(false);
                                } else {
                                    // Normal leave behavior for non-greyed labels
                                    onTickLeave();
                                }
                            }}
                        >
                            {formatLabelValue(tickValue)}x
                        </div>
                    );
                })}
            </div>
        </>
    );
}
