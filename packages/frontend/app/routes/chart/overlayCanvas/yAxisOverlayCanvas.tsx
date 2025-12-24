import { useEffect, useRef, useState, useMemo } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    getXandYLocationForChartDrag,
    getMainSeriesPaneIndex,
    scaleDataRef,
    getPriceAxisContainer,
    getPaneCanvasAndIFrameDoc,
} from './overlayCanvasUtils';
import * as d3 from 'd3';
import type { IPaneApi } from '~/tv/charting_library';
import { usePreviewOrderLines } from '../orders/usePreviewOrderLines';
import { useChartStore } from '~/stores/TradingviewChartStore';
import { useOpenOrderLines } from '../orders/useOpenOrderLines';
import { usePositionOrderLines } from '../orders/usePositionOrderLines';

const YAxisOverlayCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { chart, isChartReady } = useTradingView();
    const { orderInputPriceValue, symbol, isMidModeActive } =
        useTradeDataStore();
    const [isDrag, setIsDrag] = useState(false);
    const [mouseY, setMouseY] = useState(0);
    const [isPaneChanged, setIsPaneChanged] = useState(false);
    const isNearOrderPriceRef = useRef(false);
    const isInitialSizeSetRef = useRef(false);
    const { updateYPosition } = usePreviewOrderLines();
    const mouseOutOfFrameRef = useRef(false);

    const dragStartPriceRef = useRef<number | undefined>(undefined);
    const dragPriceRef = useRef<number | undefined>(undefined);
    const dragFrozenPriceRef = useRef<number | undefined>(undefined);
    const isDraggingRef = useRef(false);

    const { symbolInfo } = useTradeDataStore();
    const lastCandle = useChartStore((state) => state.lastCandle);

    const markPx = symbolInfo?.markPx || 1;

    const openOrderLines = useOpenOrderLines();
    const positionOrderLines = usePositionOrderLines();

    const labelAnalysis = useMemo(() => {
        if (!orderInputPriceValue.value || !chart) return null;

        const closePrice = lastCandle?.close || markPx;
        const scaleData = scaleDataRef.current;
        if (!scaleData) return null;

        const paneIndex = getMainSeriesPaneIndex(chart);
        if (paneIndex === null) return null;

        const priceScalePane = chart.activeChart().getPanes()[
            paneIndex
        ] as IPaneApi;
        const priceScale = priceScalePane.getMainSourcePriceScale();
        if (!priceScale) return null;

        const isLogarithmic = priceScale.getMode() === 1;
        const labelHeight = 15;

        const allPrices: number[] = [
            closePrice,
            ...openOrderLines.map((line) => line.yPrice),
            ...positionOrderLines.map((line) => line.yPrice),
        ].filter((price) => price > 0);

        const orderPricePixel = isLogarithmic
            ? scaleData.scaleSymlog(orderInputPriceValue.value)
            : scaleData.yScale(orderInputPriceValue.value);

        type LabelInfo = {
            price: number;
            pixel: number;
            isOrderLabel: boolean;
            isClosePrice: boolean;
        };

        const labels: LabelInfo[] = [
            ...allPrices.map((price) => ({
                price,
                pixel: isLogarithmic
                    ? scaleData.scaleSymlog(price)
                    : scaleData.yScale(price),
                isOrderLabel: false,
                isClosePrice: price === closePrice,
            })),
            {
                price: orderInputPriceValue.value,
                pixel: orderPricePixel,
                isOrderLabel: true,
                isClosePrice: false,
            },
        ];

        const aboveClosePrice = labels.filter((l) => l.price >= closePrice);
        const belowClosePrice = labels.filter((l) => l.price <= closePrice);

        aboveClosePrice.sort((a, b) => a.price - b.price);
        belowClosePrice.sort((a, b) => b.price - a.price);

        const adjustedLabels: Array<LabelInfo & { adjustedPixel: number }> = [];

        for (let i = 0; i < aboveClosePrice.length; i++) {
            const label = aboveClosePrice[i];
            let adjustedPixel = label.pixel;

            if (i > 0) {
                const prevLabel = adjustedLabels[adjustedLabels.length - 1];
                const distanceOriginal = Math.abs(
                    label.pixel - prevLabel.pixel,
                );
                const distanceAdjusted = Math.abs(
                    label.pixel - prevLabel.adjustedPixel,
                );

                if (
                    distanceOriginal < labelHeight ||
                    distanceAdjusted < labelHeight
                ) {
                    adjustedPixel = prevLabel.adjustedPixel - labelHeight;
                }
            }

            adjustedLabels.push({
                ...label,
                adjustedPixel,
            });
        }

        for (let i = 0; i < belowClosePrice.length; i++) {
            const label = belowClosePrice[i];
            let adjustedPixel = label.pixel;

            if (i > 0) {
                const prevLabel = adjustedLabels[adjustedLabels.length - 1];
                const distanceOriginal = Math.abs(
                    label.pixel - prevLabel.pixel,
                );
                const distanceAdjusted = Math.abs(
                    label.pixel - prevLabel.adjustedPixel,
                );

                if (
                    distanceOriginal < labelHeight ||
                    distanceAdjusted < labelHeight
                ) {
                    adjustedPixel = prevLabel.adjustedPixel + labelHeight;
                }
            }

            adjustedLabels.push({
                ...label,
                adjustedPixel,
            });
        }

        const orderLabel = adjustedLabels.find((l) => l.isOrderLabel);
        if (!orderLabel) return null;

        return {
            allLabels: adjustedLabels,
            orderLabel,
            closePrice,
        };
    }, [
        orderInputPriceValue.value,
        lastCandle?.close,
        markPx,
        openOrderLines,
        positionOrderLines,
        chart,
        JSON.stringify(scaleDataRef?.current?.yScale.domain()),
    ]);

    useEffect(() => {
        if (!chart) return;

        const unsubscribe = chart.subscribe('panes_order_changed', () => {
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
            isInitialSizeSetRef.current = false;
            setIsPaneChanged((prev) => !prev);
        }) as unknown as () => void;

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [chart]);

    useEffect(() => {
        if (!chart || !isChartReady) return;

        const { iframeDoc, yAxisCanvas, priceAxisContainers } =
            getPriceAxisContainer(chart);
        if (
            !iframeDoc ||
            !yAxisCanvas ||
            !yAxisCanvas.parentNode ||
            !priceAxisContainers
        )
            return;

        if (!canvasRef.current) {
            const newCanvas = iframeDoc.createElement('canvas');
            newCanvas.id = 'y-overlay';
            newCanvas.style.position = 'absolute';
            newCanvas.style.top = '0';
            newCanvas.style.left = '0';
            newCanvas.style.cursor = 'default';
            newCanvas.style.pointerEvents = 'none';
            newCanvas.style.zIndex = '5555';
            newCanvas.width = yAxisCanvas.width;
            newCanvas.height = yAxisCanvas.height;
            yAxisCanvas.parentNode.appendChild(newCanvas);
            canvasRef.current = newCanvas;
        }

        const canvas = canvasRef.current;

        const updateCanvasSize = () => {
            canvas.width = yAxisCanvas.width;
            canvas.style.width = `${yAxisCanvas.width}px`;
            canvas.height = yAxisCanvas.height;
            canvas.style.height = `${yAxisCanvas.height}px`;
        };

        updateCanvasSize();

        const yAxisResizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });

        yAxisResizeObserver.observe(yAxisCanvas);

        const containerWidths = new Map<HTMLElement, number>();
        priceAxisContainers.forEach((container) => {
            containerWidths.set(
                container,
                container.getBoundingClientRect().width,
            );
        });

        const priceAxisResizeObserver = new ResizeObserver((entries) => {
            let positionChanged = false;

            for (const entry of entries) {
                const container = entry.target as HTMLElement;
                const newWidth = entry.contentRect.width;
                const oldWidth = containerWidths.get(container) || 0;

                // Check if width changed between 0 and non-zero (position shift)
                if (
                    (oldWidth === 0 && newWidth > 0) ||
                    (oldWidth > 0 && newWidth === 0)
                ) {
                    positionChanged = true;
                }

                containerWidths.set(container, newWidth);
            }

            if (positionChanged) {
                if (canvas?.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
                canvasRef.current = null;
                isInitialSizeSetRef.current = false;
                setIsPaneChanged((prev) => !prev);
            }
        });

        priceAxisContainers.forEach((container) => {
            priceAxisResizeObserver.observe(container);
        });

        const ensureCanvasSize = () => {
            if (!isInitialSizeSetRef.current) {
                const yAxisRect = yAxisCanvas.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();

                // Check if canvas position needs updating
                if (
                    yAxisRect.left !== canvasRect.left ||
                    yAxisRect.top !== canvasRect.top
                ) {
                    canvas.style.left = '0';
                    canvas.style.top = '0';
                }

                // Check if canvas size needs updating
                const styleWidth = canvas.style.width;
                const styleHeight = canvas.style.height;

                if (
                    styleWidth !== yAxisCanvas.style.width ||
                    styleHeight !== yAxisCanvas.style.height
                ) {
                    canvas.style.width = yAxisCanvas.style.width;
                    canvas.style.height = yAxisCanvas.style.height;
                    yAxisCanvas.width = canvas.width;
                    yAxisCanvas.height = canvas.height;
                }

                isInitialSizeSetRef.current = true;
            }
        };

        const handleCanvasMouseMove = (e: MouseEvent) => {
            ensureCanvasSize();

            const rect = canvas.getBoundingClientRect();
            const y = e.clientY - rect.top;

            setMouseY(y);
        };

        const handleYAxisMouseMove = (e: MouseEvent) => {
            ensureCanvasSize();

            const rect = yAxisCanvas.getBoundingClientRect();
            const y = e.clientY - rect.top;

            setMouseY(y);
        };

        const handleMouseOut = () => {
            useTradeDataStore.getState().setIsPreviewOrderHovered(false);
        };

        canvas.addEventListener('mousemove', handleCanvasMouseMove);
        yAxisCanvas.addEventListener('mousemove', handleYAxisMouseMove);
        canvas.addEventListener('mouseout', handleMouseOut);
        yAxisCanvas.addEventListener('mouseout', handleMouseOut);

        return () => {
            yAxisResizeObserver.disconnect();
            priceAxisResizeObserver.disconnect();
            canvas.removeEventListener('mousemove', handleCanvasMouseMove);
            yAxisCanvas.removeEventListener('mousemove', handleYAxisMouseMove);
            canvas.removeEventListener('mouseout', handleMouseOut);
            yAxisCanvas.removeEventListener('mouseout', handleMouseOut);
            if (canvas?.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
            canvasRef.current = null;
            isInitialSizeSetRef.current = false;
        };
    }, [chart, isChartReady, isPaneChanged]);

    useEffect(() => {
        if (
            !canvasRef.current ||
            !chart ||
            isDrag ||
            !orderInputPriceValue.value ||
            !labelAnalysis
        )
            return;

        const canvas = canvasRef.current;
        const { orderLabel, allLabels } = labelAnalysis;
        const adjustedPixel = orderLabel.adjustedPixel;
        const tolerance = 10;
        const isNearOrderPrice = Math.abs(mouseY - adjustedPixel) <= tolerance;

        let isNearClosePrice = false;
        if (isMidModeActive) {
            const closePriceLabel = allLabels.find((l) => l.isClosePrice);
            if (closePriceLabel) {
                isNearClosePrice =
                    Math.abs(mouseY - closePriceLabel.adjustedPixel) <=
                    tolerance;
            }
        }

        const isDraggable = isNearOrderPrice || isNearClosePrice;
        isNearOrderPriceRef.current = isDraggable;

        useTradeDataStore.getState().setIsPreviewOrderHovered(isDraggable);

        if (isDraggable) {
            canvas.style.cursor = 'grab';
            canvas.style.pointerEvents = 'auto';
        } else {
            canvas.style.cursor = 'default';
            canvas.style.pointerEvents = 'none';
        }
    }, [
        mouseY,
        orderInputPriceValue.value,
        chart,
        isDrag,
        symbol,
        labelAnalysis,
        isMidModeActive,
    ]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragStart = (event: any) => {
            dragPriceRef.current = orderInputPriceValue.value;
            dragStartPriceRef.current = orderInputPriceValue.value;
            isDraggingRef.current = true;
            setIsDrag(true);
            canvas.style.cursor = 'grabbing';
            useTradeDataStore.getState().setIsMidModeActive(false);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragging = (event: any) => {
            if (!isDraggingRef.current) return;
            if (mouseOutOfFrameRef.current) return;

            const { offsetY: clientY } = getXandYLocationForChartDrag(
                event,
                canvas.getBoundingClientRect(),
            );

            const scaleData = scaleDataRef.current;
            if (!scaleData) return;

            let newPrice = scaleData.yScale.invert(clientY);

            if (chart) {
                const paneIndex = getMainSeriesPaneIndex(chart);
                if (paneIndex === null) return;

                const priceScalePane = chart.activeChart().getPanes()[
                    paneIndex
                ] as IPaneApi;
                const priceScale = priceScalePane.getMainSourcePriceScale();

                if (priceScale?.getMode() === 1) {
                    newPrice = scaleData.scaleSymlog.invert(clientY);
                }
            }

            dragPriceRef.current = newPrice;

            if (newPrice !== undefined) {
                // console.log('>>>>> updateYPosition', draggedPrice);
                updateYPosition(newPrice);
            }
        };

        const handleDragEnd = () => {
            if (!isDraggingRef.current || dragPriceRef.current === undefined)
                return;

            if (
                dragPriceRef.current < 0 &&
                dragStartPriceRef.current !== undefined
            ) {
                dragPriceRef.current = dragStartPriceRef.current;
            }

            if (
                mouseOutOfFrameRef.current &&
                dragStartPriceRef.current !== undefined
            ) {
                dragPriceRef.current = dragStartPriceRef.current;
            }

            useTradeDataStore.getState().setOrderInputPriceValue({
                value: dragPriceRef.current,
                changeType: 'dragEnd',
            });
            updateYPosition(dragPriceRef.current);

            isDraggingRef.current = false;
            dragPriceRef.current = undefined;
            setIsDrag(false);
            canvas.style.cursor = 'grab';
        };

        const dragLines = d3
            .drag<d3.DraggedElementBaseType, unknown, d3.SubjectPosition>()
            .filter(() => {
                return isNearOrderPriceRef.current;
            })
            .on('start', handleDragStart)
            .on('drag', handleDragging)
            .on('end', handleDragEnd);

        if (dragLines && canvas) {
            d3.select<d3.DraggedElementBaseType, unknown>(canvas).call(
                dragLines,
            );
        }
        return () => {
            d3.select(canvas).on('.drag', null);
        };
    }, [canvasRef.current, chart, orderInputPriceValue.value, updateYPosition]);

    useEffect(() => {
        if (!chart) return;

        const handleMouseLeave = () => {
            mouseOutOfFrameRef.current = true;
            dragFrozenPriceRef.current = dragPriceRef.current;
        };

        const handleMouseEnter = () => {
            mouseOutOfFrameRef.current = false;
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (dragStartPriceRef.current !== undefined) {
                    updateYPosition(dragStartPriceRef.current);
                    isDraggingRef.current = false;
                    dragPriceRef.current = undefined;
                }
            }
        };

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        const iframeBody = iframeDoc?.body;

        if (iframeBody) {
            iframeBody.addEventListener('mouseleave', handleMouseLeave);
            iframeBody.addEventListener('mouseenter', handleMouseEnter);
            iframeBody.addEventListener('keydown', handleEscapeKey);

            return () => {
                iframeBody.removeEventListener('mouseleave', handleMouseLeave);
                iframeBody.removeEventListener('mouseenter', handleMouseEnter);
                iframeBody.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [chart]);

    return null;
};

export default YAxisOverlayCanvas;
