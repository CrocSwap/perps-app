import { useRef, useCallback } from 'react';
import styles from './LiqLevelsSlider.module.css';
import {
    useLiquidationStore,
    LIQ_THRESHOLD_MIN,
    LIQ_THRESHOLD_MAX,
} from '~/stores/LiquidationStore';
import {
    LIQ_COLOR_TRANSPARENT,
    LIQ_COLOR_BASE,
    LIQ_COLOR_MID,
    LIQ_COLOR_TOP,
    LIQ_COLOR_YELLOW,
} from '~/routes/trade/liquidationsChart/LiquidationUtils';

const SCALE_POINTS = [
    { value: 0, position: 0 },
    { value: 100_000, position: 30 },
    { value: 10_000_000, position: 70 },
    { value: 100_000_000, position: 100 },
];

const MIN_GAP = 10_000;

const valueToPosition = (value: number): number => {
    if (value <= 0) return 0;
    if (value >= LIQ_THRESHOLD_MAX) return 100;

    for (let i = 0; i < SCALE_POINTS.length - 1; i++) {
        const start = SCALE_POINTS[i];
        const end = SCALE_POINTS[i + 1];
        if (value >= start.value && value <= end.value) {
            const valueRatio =
                (value - start.value) / (end.value - start.value);
            return (
                start.position + valueRatio * (end.position - start.position)
            );
        }
    }
    return 100;
};

const positionToValue = (position: number): number => {
    if (position <= 0) return 0;
    if (position >= 100) return LIQ_THRESHOLD_MAX;

    for (let i = 0; i < SCALE_POINTS.length - 1; i++) {
        const start = SCALE_POINTS[i];
        const end = SCALE_POINTS[i + 1];
        if (position >= start.position && position <= end.position) {
            const posRatio =
                (position - start.position) / (end.position - start.position);
            return start.value + posRatio * (end.value - start.value);
        }
    }
    return LIQ_THRESHOLD_MAX;
};

const snapToNiceValue = (value: number): number => {
    if (value <= 0) return 0;
    if (value < 100_000) return Math.round(value / 5_000) * 5_000;
    if (value < 10_000_000) return Math.round(value / 100_000) * 100_000;
    return Math.round(value / 1_000_000) * 1_000_000;
};

export const LiqLevelsSlider = () => {
    const {
        liqThresholds,
        setLiqThresholdLow,
        setLiqThresholdHigh,
        resetLiqThresholds,
    } = useLiquidationStore();
    const trackRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<'low' | 'high' | null>(null);

    const thresholdLow = liqThresholds[0];
    const thresholdHigh = liqThresholds[2];

    const lowPosition = valueToPosition(thresholdLow);
    const highPosition = valueToPosition(thresholdHigh);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, thumb: 'low' | 'high') => {
            e.preventDefault();
            draggingRef.current = thumb;

            const handleMouseMove = (moveEvent: MouseEvent) => {
                if (!trackRef.current || !draggingRef.current) return;

                const rect = trackRef.current.getBoundingClientRect();
                const x = moveEvent.clientX - rect.left;
                const percentage = Math.max(
                    0,
                    Math.min(100, (x / rect.width) * 100),
                );
                const rawValue = positionToValue(percentage);
                const snappedValue = snapToNiceValue(rawValue);

                if (draggingRef.current === 'low') {
                    const maxLow = Math.max(0, liqThresholds[2] - MIN_GAP);
                    const clampedValue = Math.max(
                        LIQ_THRESHOLD_MIN,
                        Math.min(maxLow, snappedValue),
                    );
                    setLiqThresholdLow(clampedValue);
                } else {
                    const minHigh = liqThresholds[0] + MIN_GAP;
                    const clampedValue = Math.max(
                        minHigh,
                        Math.min(LIQ_THRESHOLD_MAX, snappedValue),
                    );
                    setLiqThresholdHigh(clampedValue);
                }
            };

            const handleMouseUp = () => {
                draggingRef.current = null;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        },
        [liqThresholds, setLiqThresholdLow, setLiqThresholdHigh],
    );

    const getGradientSegments = () => {
        const segments: string[] = [];

        segments.push(`${LIQ_COLOR_TRANSPARENT} 0%`);
        segments.push(`${LIQ_COLOR_TRANSPARENT} ${lowPosition}%`);

        segments.push(`${LIQ_COLOR_BASE} ${lowPosition}%`);

        const midPosition = (lowPosition + highPosition) / 2;
        segments.push(`${LIQ_COLOR_MID} ${midPosition}%`);

        segments.push(`${LIQ_COLOR_TOP} ${highPosition}%`);

        segments.push(`${LIQ_COLOR_YELLOW} ${highPosition}%`);
        segments.push(`${LIQ_COLOR_YELLOW} 100%`);

        return segments.join(', ');
    };

    const formatThreshold = (value: number) => {
        if (value >= 1_000_000) {
            return `$${(value / 1_000_000).toFixed(1)}M`;
        }
        if (value >= 1_000) {
            return `$${(value / 1_000).toFixed(0)}K`;
        }
        return `$${value.toFixed(0)}`;
    };

    const levelRanges = [
        {
            id: 0,
            label: 'High',
            color: LIQ_COLOR_YELLOW,
            range: `${formatThreshold(thresholdHigh)} - MAX`,
            isSolidColor: true,
        },
        {
            id: 1,
            label: 'Medium',
            color: LIQ_COLOR_MID,
            range: `${formatThreshold(thresholdLow)} - ${formatThreshold(thresholdHigh)}`,
            isGradient: true,
        },
        {
            id: 2,
            label: 'Low',
            color: LIQ_COLOR_TRANSPARENT,
            range: `MIN - ${formatThreshold(thresholdLow)}`,
            isTransparent: true,
        },
    ];

    const thresholdData = [
        {
            key: 'low' as const,
            percentage: lowPosition,
            value: thresholdLow,
            leftColor: LIQ_COLOR_TRANSPARENT,
            rightColor: LIQ_COLOR_BASE,
        },
        {
            key: 'high' as const,
            percentage: highPosition,
            value: thresholdHigh,
            leftColor: LIQ_COLOR_TOP,
            rightColor: LIQ_COLOR_YELLOW,
        },
    ];

    const isModified = thresholdLow !== 100_000 || thresholdHigh !== 10_000_000;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Liquidation Levels</h3>
                <button
                    className={`${styles.resetButton} ${!isModified ? styles.resetButtonHidden : ''}`}
                    onClick={resetLiqThresholds}
                >
                    Reset
                </button>
            </div>
            <div className={styles.legend}>
                {levelRanges.map((level) => (
                    <div key={level.id} className={styles.legendItem}>
                        <div
                            className={styles.colorIndicator}
                            style={{
                                ...(level.isGradient
                                    ? {
                                          background: `linear-gradient(to right, ${LIQ_COLOR_BASE}, ${LIQ_COLOR_MID}, ${LIQ_COLOR_TOP})`,
                                      }
                                    : { backgroundColor: level.color }),
                                ...(level.isSolidColor
                                    ? { backgroundColor: level.color }
                                    : {}),
                                border: level.isTransparent
                                    ? '1px dashed rgba(255, 255, 255, 0.3)'
                                    : undefined,
                            }}
                        />
                        <span className={styles.levelLabel}>{level.label}</span>
                        <span className={styles.thresholdValue}>
                            {level.range}
                        </span>
                    </div>
                ))}
            </div>
            <div className={styles.sliderWrapper}>
                <div
                    ref={trackRef}
                    className={styles.track}
                    style={{
                        background: `linear-gradient(to right, ${getGradientSegments()})`,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                >
                    {thresholdData.map((threshold) => (
                        <div
                            key={threshold.key}
                            className={styles.thumb}
                            style={
                                {
                                    left: `${threshold.percentage}%`,
                                    '--gradient-left': threshold.leftColor,
                                    '--gradient-right': threshold.rightColor,
                                } as React.CSSProperties
                            }
                            onMouseDown={(e) =>
                                handleMouseDown(e, threshold.key)
                            }
                        >
                            <span className={styles.thumbLabel}>
                                {formatThreshold(threshold.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
