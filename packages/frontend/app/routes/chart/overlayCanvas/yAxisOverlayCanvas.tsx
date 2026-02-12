import { useEffect, useRef, useState, useMemo } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    getXandYLocationForChartDrag,
    getMainSeriesPaneIndex,
    getPriceAxisContainer,
    getPaneCanvasAndIFrameDoc,
} from './overlayCanvasUtils';
import { formatPrice, getPricetoPixel } from '../orders/customOrderLineUtils';
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
    const yAxisCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const paneCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const { chart, isChartReady } = useTradingView();
    const { orderInputPriceValue, symbol, isMidModeActive } =
        useTradeDataStore();
    const [isDrag, setIsDrag] = useState(false);
    const [mouseY, setMouseY] = useState(0);
    const [isPaneChanged, setIsPaneChanged] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const isNearOrderPriceRef = useRef(false);
    const isInitialSizeSetRef = useRef(false);
    const { updateYPosition } = usePreviewOrderLines();
    const mouseOutOfFrameRef = useRef(false);

    const dragStartPriceRef = useRef<number | undefined>(undefined);
    const dragPriceRef = useRef<number | undefined>(undefined);
    const dragFrozenPriceRef = useRef<number | undefined>(undefined);
    const isDraggingRef = useRef(false);
    const orderInputPriceValueRef = useRef<number | undefined>(
        orderInputPriceValue.value,
    );

    const { symbolInfo } = useTradeDataStore();
    const lastCandle = useChartStore((state) => state.lastCandle);

    const markPx = symbolInfo?.markPx || 1;

    const openOrderLines = useOpenOrderLines();
    const positionOrderLines = usePositionOrderLines();

    const { selectedOrderLine, setSelectedOrderLine } = useChartLinesStore();
    const localSelectedOrderLineRef = useRef(selectedOrderLine);
    const isMobile = useMobile();
    const scaleDataRef = useChartScaleStore((state) => state.scaleDataRef);

    const syncCanvasSize = () => {
        if (!chart || !canvasRef.current) return;

        const { sizeReferenceCanvas, yAxisCanvas } =
            getPriceAxisContainer(chart);

        if (!sizeReferenceCanvas) return;

        yAxisCanvasRef.current = yAxisCanvas;

        const canvas = canvasRef.current;
        canvas.style.width = sizeReferenceCanvas.style.width;
        canvas.style.height = sizeReferenceCanvas.style.height;
        canvas.width = sizeReferenceCanvas.width;
        canvas.height = sizeReferenceCanvas.height;

        if (isMobile) {
            setCanvasSize({
                width: sizeReferenceCanvas.width,
                height: sizeReferenceCanvas.height,
            });
        }
    };

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

        const dpr = window.devicePixelRatio || 1;
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
        canvasSize,
    ]);

    useEffect(() => {
        localSelectedOrderLineRef.current = selectedOrderLine;

        if (
            isMobile &&
            canvasRef.current &&
            localSelectedOrderLineRef.current &&
            selectedOrderLine === undefined
        ) {
            canvasRef.current.style.pointerEvents = 'none';
        }
    }, [selectedOrderLine, isMobile]);

    useEffect(() => {
        orderInputPriceValueRef.current = orderInputPriceValue.value;

        // Sync selectedOrderLine when price changes from non-drag source (e.g., input field)
        if (
            isMobile &&
            orderInputPriceValue.changeType !== 'dragging' &&
            orderInputPriceValue.changeType !== 'dragEnd' &&
            selectedOrderLine &&
            selectedOrderLine.type === 'PREVIEW_ORDER' &&
            orderInputPriceValue.value !== undefined
        ) {
            setSelectedOrderLine({
                ...selectedOrderLine,
                yPrice: orderInputPriceValue.value,
                textValue:
                    selectedOrderLine.textValue &&
                    selectedOrderLine.textValue.type === 'Limit'
                        ? {
                              ...selectedOrderLine.textValue,
                              price: orderInputPriceValue.value,
                          }
                        : selectedOrderLine.textValue,
            });
        }
    }, [orderInputPriceValue.value, orderInputPriceValue.changeType]);

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
    }, [chart, isPaneChanged]);

    useEffect(() => {
        if (!chart || !isChartReady) return;

        const {
            iframeDoc,
            yAxisCanvas,
            sizeReferenceCanvas,
            priceAxisContainers,
        } = getPriceAxisContainer(chart);
        const { paneCanvas } = getPaneCanvasAndIFrameDoc(chart);

        if (
            !iframeDoc ||
            !yAxisCanvas ||
            !yAxisCanvas.parentNode ||
            !priceAxisContainers ||
            !sizeReferenceCanvas ||
            !paneCanvas
        )
            return;

        // Store references
        yAxisCanvasRef.current = sizeReferenceCanvas;
        paneCanvasRef.current = paneCanvas;

        if (!canvasRef.current) {
            const newCanvas = iframeDoc.createElement('canvas');
            newCanvas.id = 'y-overlay';
            newCanvas.style.position = 'absolute';
            newCanvas.style.top = '0';
            newCanvas.style.left = '0';
            newCanvas.style.cursor = 'default';
            newCanvas.style.pointerEvents =
                isMobile && draggablePrice ? 'auto' : 'none';
            newCanvas.style.zIndex = '5555';
            newCanvas.width = sizeReferenceCanvas.width;
            newCanvas.height = sizeReferenceCanvas.height;
            yAxisCanvas.parentNode.appendChild(newCanvas);
            canvasRef.current = newCanvas;
        }

        const canvas = canvasRef.current;

        const updateCanvasSize = () => {
            const currentSizeRef = yAxisCanvasRef.current;
            if (!currentSizeRef) return;

            canvas.width = currentSizeRef.width;
            canvas.style.width = currentSizeRef.style.width;
            canvas.height = currentSizeRef.height;
            canvas.style.height = currentSizeRef.style.height;

            if (isMobile) {
                setCanvasSize({
                    width: currentSizeRef.width,
                    height: currentSizeRef.height,
                });
            }
        };

        updateCanvasSize();

        const yAxisResizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });

        yAxisResizeObserver.observe(sizeReferenceCanvas);

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

        const handleCanvasMouseMove = (e: MouseEvent) => {
            // ensureCanvasSize();

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const y = (e.clientY - rect.top) * dpr;

            setMouseY(y);
        };

        const handleYAxisMouseMove = (e: MouseEvent) => {
            // ensureCanvasSize();

            const dpr = window.devicePixelRatio || 1;
            const rect = yAxisCanvas.getBoundingClientRect();
            const y = (e.clientY - rect.top) * dpr;

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

    // Update canvas size when scale domain changes
    useEffect(() => {
        syncCanvasSize();
    }, [chart, JSON.stringify(scaleDataRef?.current?.yScale.domain())]);

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

        // BACKUP - LIQ BRANCH
        // const tolerance = 30;
        // const isNearOrderPrice = Math.abs(mouseY - adjustedPixel) <= tolerance;
        const tolerance = 30;
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
                    : orderInputPriceValueRef.current;

            dragPriceRef.current = initialPrice;
            dragStartPriceRef.current = initialPrice;
            isDraggingRef.current = true;
            setIsDrag(true);
            canvas.style.cursor = 'grabbing';
            useTradeDataStore.getState().setIsMidModeActive(false);

            // Track mobile y-axis drag start
            if (isMobile && typeof plausible === 'function') {
                plausible('Mobile Order Adjustment', {
                    props: {
                        method: 'Y-Axis Drag',
                        action: 'Start',
                        orderType:
                            localSelectedOrderLineRef.current?.type ||
                            'PREVIEW_ORDER',
                    },
                });
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragging = (event: any) => {
            if (!isDraggingRef.current) return;
            if (mouseOutOfFrameRef.current && !isMobile) return;

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
                        textValue:
                            localSelectedOrderLineRef.current.textValue &&
                            localSelectedOrderLineRef.current.textValue.type ===
                                'Limit'
                                ? {
                                      ...localSelectedOrderLineRef.current
                                          .textValue,
                                      price: newPrice,
                                  }
                                : localSelectedOrderLineRef.current.textValue,
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
                // Track y-axis drag completion
                if (typeof plausible === 'function') {
                    plausible('Mobile Order Adjustment', {
                        props: {
                            method: 'Y-Axis Drag',
                            action: 'Complete',
                            orderType: localSelectedOrderLineRef.current.type,
                        },
                    });
                }

                setSelectedOrderLine({
                    ...localSelectedOrderLineRef.current,
                    yPrice: dragPriceRef.current,
                    textValue:
                        localSelectedOrderLineRef.current.textValue &&
                        localSelectedOrderLineRef.current.textValue.type ===
                            'Limit'
                            ? {
                                  ...localSelectedOrderLineRef.current
                                      .textValue,
                                  price: dragPriceRef.current,
                              }
                            : localSelectedOrderLineRef.current.textValue,
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

        const draw = () => {
            const scaleData = scaleDataRef.current;
            if (!scaleData) return;

            const price = selectedOrderLine.yPrice;

            const { pixel: yPixel } = getPricetoPixel(
                chart,
                price,
                selectedOrderLine.type,
                canvas.height,
                scaleData,
            );
            const dpr = window.devicePixelRatio || 1;

            const fontSize = 12 * dpr;
            const borderWidth = 2;

            const priceText = formatPrice(price);

            ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif`;
            const labelWidth = canvas.width;

            const yPadding = 4 * dpr;
            const labelHeight = 20 * dpr + yPadding;

            const x = 0;
            const y = yPixel - yPadding;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

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
            ctx.fillText(priceText, textX, y + labelHeight / 2);
        };

        draw();
    }, [
        canvasRef.current,
        chart,
        isMobile,
        selectedOrderLine,
        canvasSize,
        JSON.stringify(scaleDataRef?.current?.yScale.domain()),
    ]);

    return null;
};

export default YAxisOverlayCanvas;
