import React, { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import * as d3 from 'd3';
import {
    getMainSeriesPaneIndex,
    getPaneCanvasAndIFrameDoc,
    mousePositionRef,
    scaleDataRef,
} from './overlayCanvasUtils';
import type { IPaneApi } from '~/tv/charting_library';

interface OverlayCanvasLayerProps {
    id: string;
    zIndex?: number;
    pointerEvents?: 'none' | 'auto';
    children: (props: {
        canvasRef: React.RefObject<HTMLCanvasElement | null>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        canvasSize: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scaleData: any;
        mousePositionRef: React.MutableRefObject<{ x: number; y: number }>;
        zoomChanged: boolean;
    }) => React.ReactNode;
}

const OverlayCanvasLayer: React.FC<OverlayCanvasLayerProps> = ({
    id,
    zIndex = 0,
    pointerEvents = 'none',
    children,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { chart, isChartReady } = useTradingView();

    const [isPaneChanged, setIsPaneChanged] = useState(false);

    const [zoomChanged, setZoomChanged] = useState(false);
    const prevRangeRef = useRef<{ min: number; max: number } | null>(null);

    const animationFrameRef = useRef<number>(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isZoomingRef = useRef(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [canvasSize, setCanvasSize] = useState<any>();

    useEffect(() => {
        if (!chart || !scaleDataRef.current) return;

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

                scaleDataRef.current?.yScale.domain([
                    currentRange.min,
                    currentRange.max,
                ]);
                scaleDataRef.current?.scaleSymlog.domain([
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
    }, [chart, scaleDataRef.current]);

    useEffect(() => {
        if (!chart || !isChartReady) return;

        const isFirstInit = !scaleDataRef.current;

        if (isFirstInit) {
            const yScale = d3.scaleLinear();

            const scaleSymlog = d3.scaleSymlog();
            scaleDataRef.current = { yScale, scaleSymlog };
        }

        const yScale = scaleDataRef.current!.yScale;
        const scaleSymlog = scaleDataRef.current!.scaleSymlog;

        const { iframeDoc, paneCanvas } = getPaneCanvasAndIFrameDoc(chart);

        if (!iframeDoc || !paneCanvas || !paneCanvas.parentNode) return;

        if (!canvasRef.current) {
            const newCanvas = iframeDoc.createElement('canvas');
            newCanvas.id = id;
            newCanvas.style.position = 'absolute';
            newCanvas.style.top = '0';
            newCanvas.style.left = '0';
            newCanvas.style.cursor = 'pointer';
            newCanvas.style.pointerEvents = pointerEvents;
            newCanvas.style.zIndex = zIndex.toString();
            newCanvas.width = paneCanvas.width;
            newCanvas.height = paneCanvas.height;
            paneCanvas.parentNode.appendChild(newCanvas);
            canvasRef.current = newCanvas;
        }

        const canvas = canvasRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            mousePositionRef.current = { x: offsetX, y: offsetY };
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = paneCanvas.width;
            const height = paneCanvas?.height;

            canvas.width = width;
            canvas.style.width = `${width}px`;

            canvas.height = height;
            canvas.style.height = `${height}px`;

            yScale.range([canvas.height * dpr, 0]);
            scaleSymlog.range([canvas.height * dpr, 0]);
        };

        updateCanvasSize();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const observer = new ResizeObserver((result: any) => {
            if (result) {
                const dpr = window.devicePixelRatio || 1;

                setCanvasSize({
                    styleWidth: result[0].contentRect.width,
                    styleHeight: result[0].contentRect?.height,
                    width: paneCanvas.width,
                    height: paneCanvas?.height,
                });

                yScale.range([result[0].contentRect?.height * dpr, 0]);
                scaleSymlog.range([result[0].contentRect?.height * dpr, 0]);
            }
        });

        observer.observe(paneCanvas);

        return () => {
            observer.disconnect();
            if (canvas && canvas.parentNode) {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.parentNode.removeChild(canvas);
            }
            canvasRef.current = null;
        };
    }, [chart, isChartReady, isPaneChanged]);

    useEffect(() => {
        if (chart) {
            chart.subscribe('panes_order_changed', () => {
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(
                            0,
                            0,
                            canvasRef.current.width,
                            canvasRef.current.height,
                        );
                    }
                }
                setIsPaneChanged((prev) => !prev);
            });
        }
    }, [chart]);

    useEffect(() => {
        if (
            canvasRef.current === null ||
            canvasSize === undefined ||
            scaleDataRef.current === null
        )
            return;

        const { width, height } = canvasSize;

        canvasRef.current.width = width;
        canvasRef.current.style.width = `${width}px`;

        canvasRef.current.height = height;
        canvasRef.current.style.height = `${height}px`;

        scaleDataRef.current.yScale.range([height, 0]);
        scaleDataRef.current.scaleSymlog.range([width, 0]);
    }, [canvasSize]);

    return (
        <>
            {children({
                canvasRef,
                canvasSize: canvasSize,
                scaleData: scaleDataRef.current,
                mousePositionRef,
                zoomChanged: zoomChanged,
            })}
        </>
    );
};

export default OverlayCanvasLayer;
