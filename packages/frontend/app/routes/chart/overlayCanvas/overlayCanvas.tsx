import React, { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import OrderLines from '../orders/OrderLines';
import * as d3 from 'd3';

const OverlayCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { chart } = useTradingView();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [canvasSize, setCanvasSize] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [scaleData, setScaleData] = useState<any>();

    const overlayCanvasMousePositionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!chart) return;

        const yScale = d3.scaleLinear();

        setScaleData(() => {
            return { yScale: yScale };
        });
        const chartDiv = document.getElementById('tv_chart');
        const iframe = chartDiv?.querySelector('iframe') as HTMLIFrameElement;
        const iframeDoc =
            iframe?.contentDocument || iframe?.contentWindow?.document;

        if (!iframeDoc) return;

        const paneCanvas = iframeDoc.querySelector(
            'canvas[data-name="pane-canvas"]',
        ) as HTMLCanvasElement;

        if (!paneCanvas || !paneCanvas.parentNode) return;

        if (!canvasRef.current) {
            const newCanvas = iframeDoc.createElement('canvas');
            newCanvas.id = 'overlay-canvas';
            newCanvas.style.position = 'absolute';
            newCanvas.style.top = '0';
            newCanvas.style.left = '0';
            newCanvas.style.cursor = 'pointer';
            newCanvas.style.pointerEvents = 'none';
            newCanvas.style.zIndex = '5';
            newCanvas.width = paneCanvas.width;
            newCanvas.height = paneCanvas?.height;
            paneCanvas.parentNode.appendChild(newCanvas);

            canvasRef.current = newCanvas;
        }

        const canvas = canvasRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            overlayCanvasMousePositionRef.current = { x: offsetX, y: offsetY };
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
    }, [chart]);

    return (
        <OrderLines
            overlayCanvasRef={canvasRef}
            canvasSize={canvasSize}
            scaleData={scaleData}
            overlayCanvasMousePositionRef={overlayCanvasMousePositionRef}
        />
    );
};

export default OverlayCanvas;
