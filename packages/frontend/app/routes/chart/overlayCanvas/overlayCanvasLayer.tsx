import React, { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import * as d3 from 'd3';
import {
    getMainSeriesPaneIndex,
    getPaneCanvasAndIFrameDoc,
    mousePositionRef,
    scaleDataRef,
    type CanvasSize,
} from './overlayCanvasUtils';
import type { IPaneApi } from '~/tv/charting_library';

interface OverlayCanvasLayerProps {
    id: string;
    zIndex?: number;
    pointerEvents?: 'none' | 'auto';
    children: (props: {
        canvasRef: React.RefObject<HTMLCanvasElement | null>;
        canvasWrapperRef: React.RefObject<HTMLDivElement | null>;
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
    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const { chart, isChartReady } = useTradingView();

    const [isPaneChanged, setIsPaneChanged] = useState(false);

    const [zoomChanged, setZoomChanged] = useState(false);
    const prevRangeRef = useRef<{ min: number; max: number } | null>(null);

    const animationFrameRef = useRef<number>(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isZoomingRef = useRef(false);

    const [canvasSize, setCanvasSize] = useState<CanvasSize>();

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
        const dpr = window.devicePixelRatio || 1;
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
            const wrapper = iframeDoc.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.width = paneCanvas.width / dpr + 'px';
            wrapper.style.height = paneCanvas.height / dpr + 'px';
            wrapper.style.pointerEvents = pointerEvents;
            wrapper.style.zIndex = zIndex.toString();
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.id = id + '-wrapper';

            paneCanvas.parentNode.appendChild(wrapper);

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
            newCanvas.style.height = `${paneCanvas.height / dpr}px`;
            newCanvas.style.width = `${paneCanvas.width / dpr}px`;
            wrapper.appendChild(newCanvas);

            canvasRef.current = newCanvas;
            canvasWrapperRef.current = wrapper;
        }

        const canvas = canvasRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const offsetX = (e.clientX - rect.left) * dpr;
            const offsetY = (e.clientY - rect.top) * dpr;

            mousePositionRef.current = { x: offsetX, y: offsetY };
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const observer = new ResizeObserver((result: any) => {
            if (result) {
                setCanvasSize({
                    width: paneCanvas.width,
                    height: paneCanvas.height,
                });

                if (canvasWrapperRef.current) {
                    canvasWrapperRef.current.style.width =
                        result[0].contentRect.width + 'px';
                    canvasWrapperRef.current.style.height =
                        result[0].contentRect.height + 'px';
                }

                yScale.range([paneCanvas.height, 0]);
                scaleSymlog.range([paneCanvas.height, 0]);
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

    return (
        <>
            {children({
                canvasRef,
                canvasWrapperRef,
                canvasSize: canvasSize,
                scaleData: scaleDataRef.current,
                mousePositionRef,
                zoomChanged: zoomChanged,
            })}
        </>
    );
};

export default OverlayCanvasLayer;
