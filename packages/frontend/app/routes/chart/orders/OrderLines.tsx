import React, { useEffect, useRef, useState } from 'react';
import { useOpenOrderLines } from './useOpenOrderLines';
import { usePositionOrderLines } from './usePositionOrderLines';
import LineComponent, { type LineData } from './component/LineComponent';
import LabelComponent from './component/LabelComponent';
import { useTradingView } from '~/contexts/TradingviewContext';
import type { IPaneApi } from '~/tv/charting_library';
import {
    getMainSeriesPaneIndex,
    type LabelLocationData,
} from '../overlayCanvas/overlayCanvasUtils';
import { getPricetoPixel } from './customOrderLineUtils';
import { MIN_VISIBLE_ORDER_LABEL_RATIO } from '~/utils/Constants';
import { usePreviewOrderLines } from './usePreviewOrderLines';

export type OrderLinesProps = {
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    overlayCanvasMousePositionRef: React.MutableRefObject<{
        x: number;
        y: number;
    }>;
};

export default function OrderLines({
    overlayCanvasRef,
    canvasSize,
    scaleData,
    overlayCanvasMousePositionRef,
}: OrderLinesProps) {
    const { chart } = useTradingView();

    const openLines = useOpenOrderLines();
    const positionLines = usePositionOrderLines();
    const { obPreviewLine } = usePreviewOrderLines();

    const [lines, setLines] = useState<LineData[]>([]);
    const [visibleLines, setVisibleLines] = useState<LineData[]>([]);

    const [zoomChanged, setZoomChanged] = useState(false);
    const prevRangeRef = useRef<{ min: number; max: number } | null>(null);

    const animationFrameRef = useRef<number>(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isZoomingRef = useRef(false);
    const [localChartReady, setLocalChartReady] = useState(true);
    const drawnLabelsRef = useRef<LineData[]>([]);
    const [selectedLine, setSelectedLine] = useState<
        undefined | LabelLocationData
    >(undefined);

    const arePricesEqual = (a?: number, b?: number) => {
        if (a === undefined || b === undefined) return false;
        if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

        const absA = Math.abs(a);
        const absB = Math.abs(b);
        const scale = Math.max(1, absA, absB);

        // Tolerant comparison to avoid float representation issues.
        // We only want to dedupe when the prices are effectively the same.
        return Math.abs(a - b) <= scale * 1e-10;
    };

    const normalizePrice = (value?: number) => {
        if (value === undefined || !Number.isFinite(value)) return undefined;

        // Use tick size appropriate for price magnitude (matches chart display)
        // High prices (BTC ~85000) display as integers; lower prices need finer precision
        let tick: number;
        if (value >= 10000) {
            tick = 1;
        } else if (value >= 100) {
            tick = 0.1;
        } else if (value >= 1) {
            tick = 0.01;
        } else {
            tick = 0.0001;
        }

        return Math.round(value / tick) * tick;
    };

    useEffect(() => {
        let matchFound = false;

        const hidePreviewLine =
            !!obPreviewLine &&
            openLines.some((line) => {
                if (line.type !== 'LIMIT') return false;
                if (line.textValue?.type !== 'Limit') return false;

                const normalizedOpen = normalizePrice(line.yPrice);
                const normalizedPreview = normalizePrice(obPreviewLine.yPrice);
                return arePricesEqual(normalizedOpen, normalizedPreview);
            });

        const linesData = [
            ...openLines,
            ...positionLines,
            ...(obPreviewLine && !hidePreviewLine ? [obPreviewLine] : []),
        ];

        const updatedLines = linesData.map((line) => {
            //handle lines with undefined oid
            if (!line.oid) return line;
            if (
                line.type !== 'PNL' &&
                selectedLine &&
                line.oid === selectedLine.parentLine.oid
            ) {
                matchFound = true;
                return selectedLine.parentLine;
            }
            return line;
        });

        if (selectedLine && !matchFound) {
            setSelectedLine(undefined);
        }

        setLines(updatedLines);
    }, [openLines, positionLines, obPreviewLine, selectedLine]);

    useEffect(() => {
        if (!chart || !scaleData) return;

        const chartRef = chart.activeChart();
        const paneIndex = getMainSeriesPaneIndex(chart);
        if (paneIndex === null) return;
        const priceScalePane = chartRef.getPanes()[paneIndex] as IPaneApi;
        const priceScale = priceScalePane.getMainSourcePriceScale();
        if (!priceScale) return;

        const loop = () => {
            const priceRange = priceScale.getVisiblePriceRange();
            if (priceRange) {
                const currentRange = {
                    min: priceRange.from,
                    max: priceRange.to,
                };

                scaleData?.yScale.domain([currentRange.min, currentRange.max]);
                scaleData?.scaleSymlog.domain([
                    currentRange.min,
                    currentRange.max,
                ]);

                const prevRange = prevRangeRef.current;
                const hasChanged =
                    !prevRange ||
                    prevRange.min !== currentRange.min ||
                    prevRange.max !== currentRange.max;

                if (hasChanged) {
                    prevRangeRef.current = currentRange;

                    if (!isZoomingRef.current) {
                        isZoomingRef.current = true;
                        setZoomChanged(true);
                    }

                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                    }

                    debounceTimerRef.current = setTimeout(() => {
                        isZoomingRef.current = false;
                        setZoomChanged(false);
                    }, 200);
                }
            }

            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [chart, scaleData]);

    useEffect(() => {
        if (!scaleData || !chart || !canvasSize) return;

        if (!lines.length) setVisibleLines([]);

        const [minY, maxY] = scaleData.yScale.domain();

        const filtered = lines.filter((line) => {
            const height = canvasSize.height;

            const labelInformation = getPricetoPixel(
                chart,
                line.yPrice,
                line.type,
                height,
                scaleData,
            );
            const yPricePixel = labelInformation.pixel;

            const visibleBuffer =
                labelInformation.textHeight * MIN_VISIBLE_ORDER_LABEL_RATIO;
            const labelMaxPixel = Math.ceil(
                yPricePixel + labelInformation.textHeight,
            );

            const isVisibleEnough =
                Math.min(labelMaxPixel, height) - Math.max(yPricePixel, 0) >=
                visibleBuffer;

            const max = Math.max(minY, maxY);
            const min = Math.min(minY, maxY);
            return (
                (line.yPrice >= min && line.yPrice <= max && isVisibleEnough) ||
                (selectedLine &&
                    line.oid &&
                    line.oid === selectedLine?.parentLine.oid)
            );
        });

        setVisibleLines(filtered);
    }, [
        lines,
        canvasSize,
        selectedLine,
        JSON.stringify(scaleData?.yScale.domain()),
    ]);

    return (
        <>
            <LineComponent
                key='lines'
                lines={visibleLines}
                localChartReady={localChartReady}
                setLocalChartReady={setLocalChartReady}
            />
            {localChartReady && (
                <LabelComponent
                    key='labels'
                    lines={visibleLines}
                    overlayCanvasRef={overlayCanvasRef}
                    zoomChanged={zoomChanged}
                    canvasSize={canvasSize}
                    drawnLabelsRef={drawnLabelsRef}
                    scaleData={scaleData}
                    selectedLine={selectedLine}
                    setSelectedLine={setSelectedLine}
                    overlayCanvasMousePositionRef={
                        overlayCanvasMousePositionRef
                    }
                />
            )}
        </>
    );
}
