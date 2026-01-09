import { useEffect, useRef, useState, useMemo } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    getXandYLocationForChartDrag,
    getMainSeriesPaneIndex,
    getPriceAxisContainer,
    getPaneCanvasAndIFrameDoc,
} from './overlayCanvasUtils';
import * as d3 from 'd3';
import type { IPaneApi } from '~/tv/charting_library';
import { usePreviewOrderLines } from '../orders/usePreviewOrderLines';
import { useChartStore } from '~/stores/TradingviewChartStore';
import { useOpenOrderLines } from '../orders/useOpenOrderLines';
import { usePositionOrderLines } from '../orders/usePositionOrderLines';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
import { useMobile } from '~/hooks/useMediaQuery';
import { useChartScaleStore } from '~/stores/ChartScaleStore';

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

    const { selectedOrderLine, setSelectedOrderLine } = useChartLinesStore();
    const localSelectedOrderLineRef = useRef(selectedOrderLine);
    const isMobile = useMobile();
    const scaleDataRef = useChartScaleStore((state) => state.scaleDataRef);

    const draggablePrice = useMemo(() => {
        return isMobile && selectedOrderLine
            ? selectedOrderLine.yPrice
            : orderInputPriceValue.value;
    }, [isMobile, selectedOrderLine, orderInputPriceValue.value]);

    const labelAnalysis = useMemo(() => {
        if (!draggablePrice || !chart) return null;

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
            ? scaleData.scaleSymlog(draggablePrice)
            : scaleData.yScale(draggablePrice);

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
                price: draggablePrice,
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
        draggablePrice,
        lastCandle?.close,
        markPx,
        openOrderLines,
        positionOrderLines,
        chart,
        JSON.stringify(scaleDataRef?.current?.yScale.domain()),
    ]);

    useEffect(() => {
        localSelectedOrderLineRef.current = selectedOrderLine;
    }, [selectedOrderLine]);

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
            !draggablePrice ||
            !labelAnalysis
        )
            return;

        const canvas = canvasRef.current;
        const { orderLabel, allLabels, closePrice } = labelAnalysis;
        const adjustedPixel = orderLabel.adjustedPixel;
        const originalPixel = orderLabel.pixel;
        const originalPrice = orderLabel.price;
        const tolerance = 10;
        const pixelToCheck = isMobile ? originalPixel : adjustedPixel;
        const isNearOrderPrice = Math.abs(mouseY - pixelToCheck) <= tolerance;

        const closePriceLabel = allLabels.find((l) => l.isClosePrice);
        let isNearClosePrice = false;

        const localIsMidModeActivePixel = closePriceLabel
            ? Math.abs(originalPixel - closePriceLabel.adjustedPixel) <=
              tolerance
            : false;

        const PRICE_TOLERANCE_RATIO = 0.001;
        const localIsMidModeActive =
            Math.abs(closePrice - originalPrice) / closePrice <=
            PRICE_TOLERANCE_RATIO;

        if (!isMobile) {
            if (
                isMidModeActive ||
                (localIsMidModeActive && localIsMidModeActivePixel)
            ) {
                if (closePriceLabel) {
                    isNearClosePrice =
                        Math.abs(mouseY - closePriceLabel.adjustedPixel) <=
                        tolerance;
                }
            }
        }

        const isDraggable = isNearOrderPrice || isNearClosePrice;
        isNearOrderPriceRef.current = isDraggable;

        if (!isMobile) {
            useTradeDataStore.getState().setIsPreviewOrderHovered(isDraggable);
        }

        if (isDraggable || (isMobile && draggablePrice)) {
            canvas.style.cursor = 'grab';
            canvas.style.pointerEvents = 'auto';
        } else {
            canvas.style.cursor = 'default';
            canvas.style.pointerEvents = 'none';
        }
    }, [
        mouseY,
        draggablePrice,
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
            const initialPrice =
                isMobile && localSelectedOrderLineRef.current
                    ? localSelectedOrderLineRef.current.yPrice
                    : orderInputPriceValue.value;

            dragPriceRef.current = initialPrice;
            dragStartPriceRef.current = initialPrice;
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

                if (
                    !isMobile ||
                    localSelectedOrderLineRef.current?.oid === 'previewOrder'
                )
                    updateYPosition(newPrice);

                if (isMobile && localSelectedOrderLineRef.current) {
                    setSelectedOrderLine({
                        ...localSelectedOrderLineRef.current,
                        yPrice: newPrice,
                    });
                }
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

            if (
                !isMobile ||
                localSelectedOrderLineRef.current?.oid === 'previewOrder'
            ) {
                useTradeDataStore.getState().setOrderInputPriceValue({
                    value: dragPriceRef.current,
                    changeType: 'dragEnd',
                });
                updateYPosition(dragPriceRef.current);
            }

            if (isMobile && localSelectedOrderLineRef.current) {
                setSelectedOrderLine({
                    ...localSelectedOrderLineRef.current,
                    yPrice: dragPriceRef.current,
                });
            }

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
    }, [canvasRef.current, chart, isMobile]);

    useEffect(() => {
        if (!canvasRef.current || !isMobile) return;
        if (!chart) return;

        const canvas = canvasRef.current;
        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        if (!iframeDoc) return;
        const iframeBody = iframeDoc?.body;
        if (!iframeBody) return;

        const handlePointerDown = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const y = event.clientY - rect.top;

            setMouseY(y);
        };

        iframeBody.addEventListener('pointerdown', handlePointerDown);

        return () => {
            iframeBody.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [canvasRef.current, chart, isMobile]);

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

    useEffect(() => {
        if (!canvasRef.current || !chart || !isMobile) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!selectedOrderLine) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        let animationFrameId: number | null = null;
        const zoomDomain = JSON.stringify(
            scaleDataRef?.current?.yScale.domain(),
        );
        const isZooming = zoomDomain !== '[]';

        const draw = () => {
            const scaleData = scaleDataRef.current;
            if (!scaleData) return;

            const paneIndex = getMainSeriesPaneIndex(chart);
            if (paneIndex === null) return;

            const priceScalePane = chart.activeChart().getPanes()[
                paneIndex
            ] as IPaneApi;
            const priceScale = priceScalePane.getMainSourcePriceScale();
            if (!priceScale) return;

            const isLogarithmic = priceScale.getMode() === 1;
            const price = selectedOrderLine.yPrice;

            const yPixel = isLogarithmic
                ? scaleData.scaleSymlog(price)
                : scaleData.yScale(price);

            const fontSize = 12;
            const padding = 4;
            const borderWidth = 2;

            const priceText = price.toFixed(price > 10000 ? 0 : 2);

            ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif`;
            const textWidth = ctx.measureText(priceText).width;

            const labelWidth = textWidth + padding * 2;
            const labelHeight = 20;

            const x = 0;
            const y = yPixel - labelHeight / 2 - 1;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.save();

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = borderWidth;
            ctx.beginPath();
            ctx.rect(x, y, canvas.width, labelHeight);
            ctx.stroke();

            ctx.restore();

            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x, y, canvas.width, labelHeight);

            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textX = Math.round(x + labelWidth / 2);
            const textY = Math.round(yPixel) - 2;

            ctx.fillText(priceText, textX, textY);
        };

        if (isZooming && animationFrameId === null) {
            const animate = () => {
                draw();
                animationFrameId = requestAnimationFrame(animate);
            };
            animationFrameId = requestAnimationFrame(animate);
        } else {
            draw();
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [
        canvasRef.current,
        chart,
        isMobile,
        selectedOrderLine,
        JSON.stringify(scaleDataRef?.current?.yScale.domain()),
    ]);

    return null;
};

export default YAxisOverlayCanvas;
