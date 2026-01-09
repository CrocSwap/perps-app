import React, { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import * as d3 from 'd3';
import {
    getPaneCanvasAndIFrameDoc,
    mousePositionRef,
} from './overlayCanvasUtils';
import { useChartScaleStore } from '~/stores/ChartScaleStore';

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
    const storeScaleDataRef = useChartScaleStore((state) => state.scaleDataRef);

    const [isPaneChanged, setIsPaneChanged] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [canvasSize, setCanvasSize] = useState<any>();

    useEffect(() => {
        if (!chart || !isChartReady) return;

        const isFirstInit = !storeScaleDataRef.current;

        if (isFirstInit) {
            const yScale = d3.scaleLinear();

            const scaleSymlog = d3.scaleSymlog();
            storeScaleDataRef.current = { yScale, scaleSymlog };
        }

        const yScale = storeScaleDataRef.current!.yScale;
        const scaleSymlog = storeScaleDataRef.current!.scaleSymlog;

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

        const dpr = window.devicePixelRatio || 1;
        const canvas = canvasRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const offsetX = (e.clientX - rect.left) * dpr;
            const offsetY = (e.clientY - rect.top) * dpr;

            mousePositionRef.current = { x: offsetX, y: offsetY };
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        const updateCanvasSize = () => {
            const width = paneCanvas.width;
            const height = paneCanvas?.height;

            canvas.width = width;
            canvas.style.width = `${width}px`;

            canvas.height = height;
            canvas.style.height = `${height}px`;

            yScale.range([canvas.height, 0]);
            scaleSymlog.range([canvas.height, 0]);
        };

        updateCanvasSize();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const observer = new ResizeObserver((result: any) => {
            if (result) {
                setCanvasSize({
                    styleWidth: result[0].contentRect.width,
                    styleHeight: result[0].contentRect?.height,
                    width: paneCanvas.width,
                    height: paneCanvas?.height,
                });

                yScale.range([result[0].contentRect?.height, 0]);
                scaleSymlog.range([result[0].contentRect?.height, 0]);
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
                canvasSize: canvasSize,
                scaleData: storeScaleDataRef.current,
                mousePositionRef,
            })}
        </>
    );
};

export default OverlayCanvasLayer;
