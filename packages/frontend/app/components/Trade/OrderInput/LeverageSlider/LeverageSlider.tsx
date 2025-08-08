import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import ScreenReaderAnnouncer from '~/components/ScreenReaderAnnouncer/ScreenReaderAnnouncer';
import useDebounce from '~/hooks/useDebounce';
import { useLeverageStore } from '~/stores/LeverageStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getLeverageIntervals } from '~/utils/functions/getLeverageIntervals';
import InputField from './InputField';
import styles from './LeverageSlider.module.css';
import SliderTrack from './SliderTrack';

interface LeverageSliderProps {
    value: number;
    onChange: (value: number) => void;
    onClick?: (newLeverage: number) => void;
    className?: string;
    minimumInputValue?: number;
    modalMode?: boolean;
    maxLeverage?: number;
    hideTitle?: boolean;
    minimumValue?: number;
}

const LEVERAGE_CONFIG = {
    MAX_LEVERAGE_FOR_DECIMALS: 3,
    DECIMAL_PLACES_FOR_LOW_LEVERAGE: 1,
    DECIMAL_INCREMENT: 0.1,
    DEFAULT_MAX_LEVERAGE: 100,
    TICK_COUNT_HIGH_LEVERAGE: 7,
    TICK_COUNT_LOW_LEVERAGE: 5,
    TICK_COUNT_THRESHOLD: 100,
} as const;

const SLIDER_CONFIG = {
    KNOB_RADIUS: 7,
    COLOR_STOPS: [
        { position: 0, color: '#26A69A' },
        { position: 25, color: '#89C374' },
        { position: 50, color: '#EBDF4E' },
        { position: 75, color: '#EE9A4F' },
        { position: 100, color: '#EF5350' },
    ],
    CURRENT_VALUE_THRESHOLD: 0.1,
} as const;

const UI_CONFIG = {
    INACTIVE_TICK_OPACITY: 0.3,
    INACTIVE_LABEL_COLOR: '#808080',
    MIN_SAFE_LOG_VALUE: 0.1,
} as const;

export default function LeverageSlider({
    value,
    onChange,
    className = '',
    minimumInputValue = 1,
    modalMode = false,
    maxLeverage,
    hideTitle = false,
    minimumValue,
    onClick,
}: LeverageSliderProps) {
    const { symbolInfo } = useTradeDataStore();
    const {
        currentMarket,
        setPreferredLeverage,
        validateAndApplyLeverageForMarket,
        getPreferredLeverage,
    } = useLeverageStore();

    const maximumInputValue = modalMode
        ? maxLeverage || LEVERAGE_CONFIG.DEFAULT_MAX_LEVERAGE
        : symbolInfo?.coin === 'BTC'
          ? 100
          : symbolInfo?.maxLeverage || LEVERAGE_CONFIG.DEFAULT_MAX_LEVERAGE;

    const effectiveMinimum =
        minimumValue !== undefined ? minimumValue : minimumInputValue;

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
    const [unconstrainedSliderValue, setUnconstrainedSliderValue] =
        useState<number>(0);
    const [hasInitializedLeverage, setHasInitializedLeverage] =
        useState<boolean>(false);
    const [announceText, setAnnounceText] = useState<string>('');

    const sliderRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const currentValueRef = useRef<number>(currentValue);

    useEffect(() => {
        currentValueRef.current = currentValue;
    }, [currentValue]);

    // Helper functions
    const formatValue = (val: number): string => {
        if (val < 3) {
            const roundedVal = Math.floor(val * 10) / 10;
            return roundedVal.toFixed(
                LEVERAGE_CONFIG.DECIMAL_PLACES_FOR_LOW_LEVERAGE,
            );
        } else {
            return Math.floor(val).toString();
        }
    };

    const formatLabelValue = (val: number): string => {
        return Math.floor(val).toString();
    };

    const constrainValue = (val: number): number => {
        return Math.max(effectiveMinimum, Math.min(maximumInputValue, val));
    };

    // Warning state management
    const [sliderBelowMinimumLeverage, setSliderBelowMinimumLeverage] =
        useState(false);
    const [warningTimeout, setWarningTimeout] = useState<NodeJS.Timeout | null>(
        null,
    );

    const sliderBelowMinimumLeverageDebounced = useDebounce(
        sliderBelowMinimumLeverage,
        200,
    );

    const shouldShowMinimumConstraints =
        minimumValue !== undefined && minimumValue > 1;

    const showMinimumWarning =
        shouldShowMinimumConstraints &&
        (sliderBelowMinimumLeverage
            ? isDragging
                ? true
                : sliderBelowMinimumLeverageDebounced
            : false);

    const [hasShownMinimumWarning, setHasShownMinimumWarning] = useState(false);

    const shouldShowInteractiveWarning = useMemo(() => {
        // Don't show warnings if minimumValue is undefined or equals 1
        if (!shouldShowMinimumConstraints) return false;

        const minWithBuffer = minimumValue * 10 ** -0.08;
        const isDraggingBelowMinimum =
            isDragging && unconstrainedSliderValue <= minWithBuffer;

        const isHoveringBelowMinimum =
            !isDragging &&
            hoveredTickIndex === null &&
            isHovering &&
            hoverValue !== null &&
            hoverValue <= minWithBuffer;

        return isDraggingBelowMinimum || isHoveringBelowMinimum;
    }, [
        shouldShowMinimumConstraints,
        minimumValue,
        unconstrainedSliderValue,
        isDragging,
        isHovering,
        hoverValue,
        hoveredTickIndex,
    ]);

    // Position and color calculations
    const valueToPercentage = (val: number): number => {
        if (isNaN(val) || isNaN(minimumInputValue) || isNaN(maximumInputValue))
            return 0;
        if (minimumInputValue <= 0 || maximumInputValue <= minimumInputValue)
            return 0;

        const safeVal = Math.max(
            minimumInputValue,
            Math.min(maximumInputValue, val),
        );

        if (maximumInputValue <= LEVERAGE_CONFIG.MAX_LEVERAGE_FOR_DECIMALS) {
            return (
                ((safeVal - minimumInputValue) /
                    (maximumInputValue - minimumInputValue)) *
                100
            );
        }

        const safeMin = Math.max(
            UI_CONFIG.MIN_SAFE_LOG_VALUE,
            minimumInputValue,
        );

        try {
            const minLog = Math.log(safeMin);
            const maxLog = Math.log(maximumInputValue);
            const valueLog = Math.log(safeVal);

            return ((valueLog - minLog) / (maxLog - minLog)) * 100;
        } catch (error) {
            console.error('Error calculating percentage:', error);
            return 0;
        }
    };

    const percentageToValue = (percentage: number): number => {
        if (minimumInputValue <= 0 || maximumInputValue <= minimumInputValue)
            return minimumInputValue;

        const boundedPercentage = Math.max(0, Math.min(100, percentage));

        if (maximumInputValue <= LEVERAGE_CONFIG.MAX_LEVERAGE_FOR_DECIMALS) {
            const value =
                minimumInputValue +
                (boundedPercentage / 100) *
                    (maximumInputValue - minimumInputValue);
            return value;
        }

        const safeMin = Math.max(
            UI_CONFIG.MIN_SAFE_LOG_VALUE,
            minimumInputValue,
        );
        const minLog = Math.log(safeMin);
        const maxLog = Math.log(maximumInputValue);
        const valueLog = minLog + (boundedPercentage / 100) * (maxLog - minLog);

        return Math.exp(valueLog);
    };

    const getKnobPosition = (): number => {
        if (isNaN(currentValue) || !isFinite(currentValue)) {
            return 0;
        }
        return valueToPercentage(currentValue);
    };

    const getMinimumPercentage = (): number => {
        if (!shouldShowMinimumConstraints) return 0;
        return valueToPercentage(minimumValue);
    };

    const getColorAtPosition = (position: number): string => {
        const colorStops = SLIDER_CONFIG.COLOR_STOPS;
        if (isNaN(position) || !isFinite(position)) {
            return colorStops[0].color;
        }

        const boundedPosition = Math.max(0, Math.min(100, position));

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

        if (boundedPosition === lowerStop.position) return lowerStop.color;
        if (boundedPosition === upperStop.position) return upperStop.color;

        const factor =
            (boundedPosition - lowerStop.position) /
            (upperStop.position - lowerStop.position);

        const parseColor = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };

        const lowerColor = parseColor(lowerStop.color);
        const upperColor = parseColor(upperStop.color);

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

    const getKnobColor = (): string => {
        return getColorAtPosition(getKnobPosition());
    };

    const createGradientString = (): string => {
        return `linear-gradient(to right, 
            #26A69A 0%, 
            #89C374 25%, 
            #EBDF4E 50%, 
            #EE9A4F 75%, 
            #EF5350 100%)`;
    };

    // Event handlers
    const announceValueChange = (value: number) => {
        const formattedValue = formatValue(value);
        setAnnounceText('');
        setTimeout(() => {
            setAnnounceText(`Leverage ${formattedValue}x`);
        }, 100);
        setTimeout(() => setAnnounceText(''), 1500);
    };

    const handleLeverageChange = (newLeverage: number) => {
        const newLeverageOrMinAllowedForUser = Math.max(
            newLeverage,
            minimumValue || 1,
        );

        setPreferredLeverage(newLeverageOrMinAllowedForUser);
        onChange(newLeverageOrMinAllowedForUser);
        announceValueChange(newLeverageOrMinAllowedForUser);
    };

    const handleSmoothLeverageChange = (newLeverage: number) => {
        onChange(newLeverage);
    };

    const calculateValueFromPosition = (clientX: number): number => {
        if (!sliderRef.current) return currentValue;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));

        const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
        const adjustedOffsetX = Math.max(
            knobRadius,
            Math.min(offsetX, rect.width - knobRadius),
        );
        const percentage =
            ((adjustedOffsetX - knobRadius) / (rect.width - 2 * knobRadius)) *
            100;

        const newValue = percentageToValue(percentage);
        return constrainValue(newValue);
    };

    // Track event handlers
    const handleTrackMouseMove = (e: React.MouseEvent) => {
        if (!sliderRef.current || isDragging) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(
            0,
            Math.min(e.clientX - rect.left, rect.width),
        );

        const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
        const adjustedOffsetX = Math.max(
            knobRadius,
            Math.min(offsetX, rect.width - knobRadius),
        );
        const percentage =
            ((adjustedOffsetX - knobRadius) / (rect.width - 2 * knobRadius)) *
            100;

        const newValue = percentageToValue(percentage);
        if (shouldShowMinimumConstraints && newValue < minimumValue!) {
            return;
        }

        setHoverValue(newValue);
        setIsHovering(true);
        setHoveredTickIndex(null);
    };

    const handleTrackMouseLeave = () => {
        setIsHovering(false);
        setHoverValue(null);
        setHoveredTickIndex(null);
    };

    const handleTrackClick = (e: React.MouseEvent) => {
        const boundedValue = calculateValueFromPosition(e.clientX);
        if (onClick) {
            onClick(Math.max(boundedValue, minimumValue || 1));
        } else {
            handleLeverageChange(boundedValue);
        }
    };

    const handleTrackTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest(`.${styles.sliderKnob}`)) {
            return;
        }

        if (!e.touches[0]) return;

        const boundedValue = calculateValueFromPosition(e.touches[0].clientX);
        handleLeverageChange(boundedValue);
        setIsDragging(true);
        e.preventDefault();
    };

    const handleTrackMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest(`.${styles.sliderKnob}`)) {
            return;
        }

        handleTrackClick(e);
        setIsDragging(true);
        e.preventDefault();
    };

    const handleKnobMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        (e.target as HTMLElement).focus();
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        let newValue = currentValue;
        const step =
            maximumInputValue <= LEVERAGE_CONFIG.MAX_LEVERAGE_FOR_DECIMALS
                ? 0.1
                : 1;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                newValue = Math.min(maximumInputValue, currentValue + step);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                newValue = Math.max(minimumInputValue, currentValue - step);
                break;
            case 'Home':
                newValue = minimumInputValue;
                break;
            case 'End':
                newValue = maximumInputValue;
                break;
            case 'PageUp':
                newValue = Math.min(
                    maximumInputValue,
                    currentValue + step * 10,
                );
                break;
            case 'PageDown':
                newValue = Math.max(
                    minimumInputValue,
                    currentValue - step * 10,
                );
                break;
            default:
                return;
        }

        e.preventDefault();
        handleLeverageChange(newValue);
    };

    // Input handlers
    const handleInputChange = (value: string) => {
        setInputValue(value);
    };

    const handleInputBlur = () => {
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue)) {
            const boundedValue = constrainValue(newValue);
            handleLeverageChange(boundedValue);
        } else {
            setInputValue(formatValue(currentValue));
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    // Effects
    useEffect(() => {
        if (!shouldShowMinimumConstraints) {
            setSliderBelowMinimumLeverage(false);
            if (warningTimeout) {
                clearTimeout(warningTimeout);
                setWarningTimeout(null);
            }
            return;
        }
        const isCurrentAtMinimum = Math.abs(currentValue - minimumValue) < 0.01;

        if (shouldShowInteractiveWarning) {
            setSliderBelowMinimumLeverage(true);
            if (warningTimeout) {
                clearTimeout(warningTimeout);
                setWarningTimeout(null);
            }
        } else if (isCurrentAtMinimum && !hasShownMinimumWarning) {
            setSliderBelowMinimumLeverage(true);
            setHasShownMinimumWarning(true);

            const timeout = setTimeout(() => {
                setSliderBelowMinimumLeverage(false);
                setWarningTimeout(null);
            }, 3000);

            setWarningTimeout(timeout);
        } else if (!isCurrentAtMinimum) {
            setHasShownMinimumWarning(false);
            setSliderBelowMinimumLeverage(false);
            if (warningTimeout) {
                clearTimeout(warningTimeout);
                setWarningTimeout(null);
            }
        } else if (!shouldShowInteractiveWarning && hasShownMinimumWarning) {
            setSliderBelowMinimumLeverage(false);
            if (warningTimeout) {
                clearTimeout(warningTimeout);
                setWarningTimeout(null);
            }
        }

        return () => {
            if (warningTimeout) {
                clearTimeout(warningTimeout);
            }
        };
    }, [
        currentValue,
        minimumValue,
        shouldShowInteractiveWarning,
        hasShownMinimumWarning,
        warningTimeout,
        shouldShowMinimumConstraints,
    ]);

    const handleMarketChange = useCallback(() => {
        const effectiveSymbol = symbolInfo?.coin;
        const currentMaxLeverage =
            effectiveSymbol === 'BTC' ? 100 : symbolInfo?.maxLeverage;

        if (!effectiveSymbol || !currentMaxLeverage) {
            return;
        }

        const isMarketChange = currentMarket !== effectiveSymbol;
        const isFirstLoad = !hasInitializedLeverage;

        if (isMarketChange || isFirstLoad) {
            console.log(
                `LeverageSlider: Applying leverage for ${effectiveSymbol} (${currentMaxLeverage}x max)`,
            );

            const validatedLeverage = validateAndApplyLeverageForMarket(
                effectiveSymbol,
                currentMaxLeverage,
                minimumInputValue,
            );

            onChange(validatedLeverage);
            setHasInitializedLeverage(true);
        } else {
            if (modalMode) return;
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

                onChange(validatedLeverage);
            }
        }
    }, [
        symbolInfo?.coin,
        symbolInfo?.maxLeverage,
        currentMarket,
        minimumInputValue,
        hasInitializedLeverage,
        modalMode,
        value,
        maximumInputValue,
        onChange,
        validateAndApplyLeverageForMarket,
        getPreferredLeverage,
    ]);

    useEffect(() => {
        handleMarketChange();
    }, [handleMarketChange]);

    useEffect(() => {
        setInputValue(formatValue(currentValue));
    }, [currentValue, maximumInputValue]);

    useEffect(() => {
        if (inputValue === '') {
            setInputValue(formatValue(currentValue));
            if (value === undefined || value === null) {
                handleLeverageChange(1);
            }
        }
    }, [maximumInputValue]);

    useEffect(() => {
        const ticks = getLeverageIntervals(
            maximumInputValue,
            minimumInputValue,
        );
        setTickMarks(ticks);
    }, [minimumInputValue, maximumInputValue]);

    // Dragging effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const offsetX = Math.max(
                0,
                Math.min(e.clientX - rect.left, rect.width),
            );

            const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
            const adjustedOffsetX = Math.max(
                knobRadius,
                Math.min(offsetX, rect.width - knobRadius),
            );
            const percentage =
                ((adjustedOffsetX - knobRadius) /
                    (rect.width - 2 * knobRadius)) *
                100;

            const newValue = percentageToValue(percentage);
            setUnconstrainedSliderValue(newValue);
            const boundedValue = constrainValue(newValue);

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

            const knobRadius = SLIDER_CONFIG.KNOB_RADIUS;
            const adjustedOffsetX = Math.max(
                knobRadius,
                Math.min(offsetX, rect.width - knobRadius),
            );
            const percentage =
                ((adjustedOffsetX - knobRadius) /
                    (rect.width - 2 * knobRadius)) *
                100;

            const newValue = percentageToValue(percentage);
            const boundedValue = constrainValue(newValue);

            handleSmoothLeverageChange(boundedValue);
            e.preventDefault();
        };

        const handleMouseUp = () => {
            if (isDragging && !modalMode) {
                setPreferredLeverage(currentValueRef.current);
            }
            setIsDragging(false);
        };

        const handleTouchEnd = () => {
            if (isDragging && !modalMode) {
                setPreferredLeverage(currentValueRef.current);
            }
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove, {
                passive: false,
            });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging, minimumInputValue, maximumInputValue, modalMode]);

    const containerClasses = [
        styles.leverageSliderContainer,
        className,
        modalMode && styles.modalContainer,
        currentValue !== 1 && styles.sliderContainerNotAtFirst,
    ]
        .filter(Boolean)
        .join(' ');

    const titleClasses = [
        styles.titleWithWarning,
        modalMode && styles.modalTitle,
    ]
        .filter(Boolean)
        .join(' ');

    const warningClasses = [
        modalMode ? styles.modalSliderWarning : styles.minimumWarning,
    ].join(' ');

    const sliderContainerClasses = [
        modalMode ? styles.modalSliderContainer : styles.sliderWithValue,
    ].join(' ');

    const inputFieldProps = {
        value: inputValue,
        currentValue: currentValue,
        isDragging: isDragging,
        modalMode: modalMode,
        knobColor: getKnobColor(),
        onChange: handleInputChange,
        onBlur: handleInputBlur,
        onKeyDown: handleInputKeyDown,
        formatValue: formatValue,
    };
    const sliderTrackProps = {
        sliderRef: sliderRef,
        knobRef: knobRef,
        currentValue: currentValue,
        value: value,
        minimumInputValue: minimumInputValue,
        maximumInputValue: maximumInputValue,
        minimumValue: minimumValue,
        shouldShowMinimumConstraints: shouldShowMinimumConstraints,
        tickMarks: tickMarks,
        hoveredTickIndex: hoveredTickIndex,
        hoverValue: hoverValue,
        isHovering: isHovering,
        knobPosition: getKnobPosition(),
        minimumPercentage: getMinimumPercentage(),
        gradientString: createGradientString(),
        knobColor: getKnobColor(),
        onClick: onClick,
        onKeyDown: handleKeyDown,
        onTrackMouseDown: handleTrackMouseDown,
        onTrackTouchStart: handleTrackTouchStart,
        onTrackMouseMove: handleTrackMouseMove,
        onTrackMouseLeave: handleTrackMouseLeave,
        onKnobMouseDown: handleKnobMouseDown,
        onTickHover: handleTickHover,
        onTickLeave: handleTickLeave,
        onLeverageChange: handleLeverageChange,
        valueToPercentage: valueToPercentage,
        getColorAtPosition: getColorAtPosition,
        formatLabelValue: formatLabelValue,
        setSliderBelowMinimumLeverage: setSliderBelowMinimumLeverage,
    };

    return (
        <div className={containerClasses}>
            {!hideTitle && (
                <div className={titleClasses}>
                    <h3 className={styles.containerTitle}>Leverage</h3>
                    {!modalMode && showMinimumWarning && (
                        <div className={warningClasses}>
                            {minimumValue !== undefined && (
                                <>Close position to reduce minimum leverage</>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={sliderContainerClasses}>
                {modalMode && <InputField {...inputFieldProps} />}

                <div className={modalMode ? undefined : styles.sliderContainer}>
                    {modalMode && showMinimumWarning && (
                        <div className={warningClasses}>
                            {minimumValue !== undefined && (
                                <>Close position to reduce minimum leverage</>
                            )}
                        </div>
                    )}

                    <SliderTrack {...sliderTrackProps} />
                </div>

                {!modalMode && <InputField {...inputFieldProps} />}
            </div>

            <ScreenReaderAnnouncer text={announceText} />
        </div>
    );
}
