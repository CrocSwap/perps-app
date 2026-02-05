import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useMobile } from '~/hooks/useMediaQuery';
import type { LimitOrderParams } from '~/services/limitOrderService';
import { makeSlug, useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
import { useChartScaleStore } from '~/stores/ChartScaleStore';
import type { IPaneApi } from '~/tv/charting_library';
import { getTxLink } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import {
    findLimitLabelAtPosition,
    getMainSeriesPaneIndex,
    getPaneCanvasAndIFrameDoc,
    getXandYLocationForChartDrag,
    type LabelLocationData,
} from '../../overlayCanvas/overlayCanvasUtils';
import {
    formatLineLabel,
    getPricetoPixel,
    updateOverlayCanvasSize,
} from '../customOrderLineUtils';
import {
    drawLabel,
    drawLabelMobile,
    drawLiqLabel,
    type LabelLocation,
    type LabelType,
} from '../orderLineUtils';
import type { LineData } from './LineComponent';
import { t } from 'i18next';
import { usePreviewOrderLines } from '../usePreviewOrderLines';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';

interface LabelProps {
    lines: LineData[];
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    zoomChanged: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
    // drawnLabels: LineData[];
    // setDrawnLabels: React.Dispatch<React.SetStateAction<LineData[]>>;
    drawnLabelsRef: React.MutableRefObject<LineData[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    activeDragLine: LabelLocationData | undefined;
    setActiveDragLine: React.Dispatch<
        React.SetStateAction<LabelLocationData | undefined>
    >;
    overlayCanvasMousePositionRef: React.MutableRefObject<{
        x: number;
        y: number;
    }>;
}

const LabelComponent = ({
    lines,
    overlayCanvasRef,
    zoomChanged,
    canvasSize,
    drawnLabelsRef,
    scaleData,
    activeDragLine,
    setActiveDragLine,
    overlayCanvasMousePositionRef,
}: LabelProps) => {
    const { chart, isChartReady } = useTradingView();

    const notifications = useNotificationStore();

    const { formatNum } = useNumFormatter();

    const symbolInfo = useTradeDataStore((state) => state.symbolInfo);

    const { executeCancelOrder } = useCancelOrderService();
    const { executeLimitOrder } = useLimitOrderService();
    const { updateYPosition } = usePreviewOrderLines();
    const ctx = overlayCanvasRef.current?.getContext('2d');

    const sessionState = useSession();
    const isSessionEstablished = isEstablished(sessionState);

    const isMobile = useMobile();
    const {
        setSelectedOrderLine,
        selectedOrderLine,
        shouldConfirmOrder,
        setShouldConfirmOrder,
        setShowPlusButton,
        setIsCancelClicking,
    } = useChartLinesStore();

    const priceDomain = useChartScaleStore((state) => state.priceDomain);

    const [isDrag, setIsDrag] = useState(false);

    useEffect(() => {
        if (!isMobile || !overlayCanvasRef.current) return;
        if (selectedOrderLine) {
            if (activeDragLine?.parentLine !== selectedOrderLine) {
                setActiveDragLine(
                    activeDragLine
                        ? { ...activeDragLine, parentLine: selectedOrderLine }
                        : undefined,
                );
            }

            const price = selectedOrderLine.yPrice;
            if (priceDomain) {
                const isOutOfDomain =
                    price < priceDomain.min || price > priceDomain.max;

                if (!isDrag && !isOutOfDomain) {
                    overlayCanvasRef.current.style.pointerEvents = 'auto';
                }
            }
        } else if (!selectedOrderLine && activeDragLine) {
            setActiveDragLine(undefined);
        }

        if (overlayCanvasRef.current && !selectedOrderLine) {
            overlayCanvasRef.current.style.pointerEvents = 'none';
        }
    }, [selectedOrderLine, isMobile, isDrag]);

    // Handle confirm from control panel
    useEffect(() => {
        if (shouldConfirmOrder && selectedOrderLine && isMobile) {
            if (selectedOrderLine.type === 'LIMIT') {
                const labelData = {
                    parentLine: selectedOrderLine,
                } as LabelLocationData;
                limitOrderDragEnd(labelData);
            }
            setShouldConfirmOrder(false);
        }
    }, [shouldConfirmOrder, selectedOrderLine, isMobile]);
    const dragStateRef = useRef<{
        tempSelectedLine: LabelLocationData | undefined;
        originalPrice: number | undefined;
        isDragging: boolean;
        isOutsideArea: boolean;
        frozenPrice: number | undefined;
    }>({
        tempSelectedLine: undefined,
        originalPrice: undefined,
        isDragging: false,
        isOutsideArea: false,
        frozenPrice: undefined,
    });

    const isLiqPriceLineDraggable = false;

    // Keep dragStateRef.originalPrice in sync with selectedOrderLine for mobile
    useEffect(() => {
        if (
            isMobile &&
            selectedOrderLine &&
            selectedOrderLine.originalPrice !== undefined
        ) {
            dragStateRef.current.originalPrice =
                selectedOrderLine.originalPrice;
        } else if (!selectedOrderLine) {
            dragStateRef.current.originalPrice = undefined;
        }
    }, [selectedOrderLine, isMobile]);

    function roundDownToTenth(value: number) {
        return Math.floor(value * 10) / 10;
    }

    const limitOrderDragEnd = async (tempSelectedLine: LabelLocationData) => {
        const orderId = tempSelectedLine.parentLine.oid;
        const newPrice = tempSelectedLine.parentLine.yPrice;
        const quantity = tempSelectedLine.parentLine.quantityTextValue;
        const side = tempSelectedLine.parentLine.side;

        const slug = makeSlug(10);

        if (!orderId || !side) return;
        try {
            const usdValueOfOrderStr = formatNum(
                (quantity || 0) * (symbolInfo?.markPx || 1),
                2,
                true,
                true,
            );
            // Show pending notification
            notifications.add({
                title: t('transactions.limitOrderUpdatePending.title'),
                message: t('transactions.limitOrderUpdatePending.message', {
                    side,
                    value: usdValueOfOrderStr,
                    coin: symbolInfo?.coin,
                    limitPrice: formatNum(
                        roundDownToTenth(newPrice),
                        newPrice > 10_000 ? 0 : 2,
                        true,
                        true,
                    ),
                }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });

            const newOrderParams: LimitOrderParams = {
                price: roundDownToTenth(newPrice),
                side,
                quantity: quantity,
                replaceOrderId: BigInt(orderId),
            } as LimitOrderParams;

            const timeOfTxBuildStart = Date.now();
            const limitOrderResult = await executeLimitOrder(newOrderParams);

            if (!limitOrderResult.success) {
                setActiveDragLine(undefined);
                console.error(
                    'Failed to create new order:',
                    limitOrderResult.error,
                );
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Update Fail',
                            orderType: 'Limit',
                            direction: side === 'buy' ? 'Buy' : 'Sell',
                            success: false,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                limitOrderResult.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                limitOrderResult.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: limitOrderResult.signature,
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.failedToUpdatedOrder.title'),
                    message:
                        limitOrderResult.error ||
                        t('transactions.unknownErrorOccurred'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(limitOrderResult.signature),
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Update Success',
                            orderType: 'Limit',
                            direction: side === 'buy' ? 'Buy' : 'Sell',
                            success: true,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                limitOrderResult.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                limitOrderResult.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: limitOrderResult.signature,
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.orderUpdated.title'),
                    message: t('transactions.orderUpdated.message', {
                        usdValueOfOrderStr,
                        symbol: symbolInfo?.coin,
                        limitPrice: formatNum(
                            roundDownToTenth(newPrice),
                            newPrice > 10_000 ? 0 : 2,
                            true,
                            true,
                        ),
                    }),
                    icon: 'check',
                    removeAfter: 10000,
                    txLink: getTxLink(limitOrderResult.signature),
                });
            }
        } catch (error) {
            setActiveDragLine(undefined);
            console.error('Error updating order:', error);
            notifications.remove(slug);
            notifications.add({
                title: t('transactions.errorUpdatingOrder.title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
            });
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Limit Update Fail',
                        orderType: 'Limit',
                        direction: side === 'buy' ? 'Buy' : 'Sell',
                        success: false,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
        }
    };

    useEffect(() => {
        if (!chart || !isChartReady || !ctx || !canvasSize) return;

        let animationFrameId: number | null = null;

        const draw = () => {
            let heightAttr = canvasSize?.height;
            let widthAttr = canvasSize?.width;
            if (overlayCanvasRef.current) {
                updateOverlayCanvasSize(overlayCanvasRef.current, canvasSize);
            }
            if (overlayCanvasRef.current) {
                const { iframeDoc, paneCanvas } =
                    getPaneCanvasAndIFrameDoc(chart);

                if (!iframeDoc || !paneCanvas || !paneCanvas.parentNode) return;

                const width = overlayCanvasRef.current.style.width;
                const height = overlayCanvasRef.current.style?.height;

                heightAttr = paneCanvas?.height;
                widthAttr = paneCanvas.width;

                if (
                    width !== canvasSize?.styleWidth ||
                    height !== canvasSize?.styleWidth
                ) {
                    overlayCanvasRef.current.style.width = `${canvasSize?.styleWidth}px`;
                    overlayCanvasRef.current.style.height = `${canvasSize?.styleHeight}px`;
                    overlayCanvasRef.current.width = paneCanvas.width;
                    overlayCanvasRef.current.height = paneCanvas.height;
                }
            }

            drawnLabelsRef.current.map((i) => {
                const data = i.labelLocations;
                data?.forEach((item) => {
                    ctx.clearRect(item.x, item.y, item.width, item.height);
                });
            });

            const linesWithLabels = lines.map((line) => {
                const yPricePixel = getPricetoPixel(
                    chart,
                    line.yPrice,
                    line.type,
                    heightAttr,
                    scaleData,
                ).pixel;

                const xPixel = widthAttr * line.xLoc;

                const isLineSelected =
                    isMobile && selectedOrderLine?.oid === line.oid;

                const hasChanges =
                    isLineSelected &&
                    selectedOrderLine &&
                    selectedOrderLine.originalPrice !== undefined &&
                    Math.abs(
                        selectedOrderLine.yPrice -
                            selectedOrderLine.originalPrice,
                    ) > 0.001;

                if (hasChanges && !activeDragLine) {
                    setActiveDragLine({
                        label: undefined,
                        parentLine: selectedOrderLine,
                    });
                }
                const priceColor =
                    hasChanges && line.textValue?.type === 'Limit'
                        ? '#F97316'
                        : line.priceColor;

                const baseLabelOptions = [
                    {
                        type: 'Main' as LabelType,
                        text: line.textValue
                            ? formatLineLabel(line.textValue)
                            : '',
                        backgroundColor: '#D1D1D1',
                        textColor: '#3C91FF',
                        borderColor: line.color,
                        priceColor: priceColor,
                    },
                    ...(line.quantityText
                        ? [
                              {
                                  type: 'Quantity' as LabelType,
                                  text: line.quantityText,
                                  backgroundColor: '#000000',
                                  textColor: '#FFFFFF',
                                  borderColor: '#3C91FF',
                              },
                          ]
                        : []),
                ];

                const labelOptions = [
                    ...baseLabelOptions,
                    ...(line.type === 'LIMIT'
                        ? [
                              {
                                  type: 'Cancel' as LabelType,
                                  text: ' X ',
                                  backgroundColor: '#D1D1D1',
                                  textColor: '#3C91FF',
                                  borderColor: '#3C91FF',
                              },
                          ]
                        : []),
                ];

                let labelLocations: LabelLocation[] = [];

                if (line.textValue) {
                    if (line.type !== 'LIQ') {
                        if (isMobile) {
                            const isLineSelected =
                                selectedOrderLine?.oid === line.oid;

                            const mobileLabelOptions = [
                                ...baseLabelOptions,
                                ...(isLineSelected && line.type === 'LIMIT'
                                    ? [
                                          {
                                              type: 'Cancel' as LabelType,
                                              text: ' X ',
                                              backgroundColor: '#D1D1D1',
                                              textColor: '#3C91FF',
                                              borderColor: '#3C91FF',
                                          },
                                      ]
                                    : []),
                            ];

                            const mobileLabelYPixel =
                                isLineSelected && selectedOrderLine
                                    ? getPricetoPixel(
                                          chart,
                                          selectedOrderLine.yPrice,
                                          line.type,
                                          heightAttr,
                                          scaleData,
                                      ).pixel
                                    : yPricePixel;

                            labelLocations = drawLabelMobile(
                                ctx,
                                {
                                    x: xPixel,
                                    y: mobileLabelYPixel,
                                    labelOptions: mobileLabelOptions,
                                    color: line.color,
                                },
                                line.type === 'LIMIT',
                            );
                        } else {
                            labelLocations = drawLabel(
                                ctx,
                                {
                                    x: xPixel,
                                    y: yPricePixel,
                                    labelOptions,
                                    color: line.color,
                                },
                                line.type === 'LIMIT',
                            );
                        }
                    } else {
                        labelLocations = drawLiqLabel(
                            ctx,
                            {
                                x: xPixel,
                                y: yPricePixel,
                                labelOptions,
                                color: line.color,
                            },
                            canvasSize.width,
                            isLiqPriceLineDraggable,
                        );
                    }
                }

                // Add full-width clickable area for PREVIEW_ORDER lines
                if (line.type === 'PREVIEW_ORDER') {
                    const dpr = window.devicePixelRatio || 1;
                    const height = 15 * dpr;
                    labelLocations.push({
                        type: 'Main',
                        x: 0,
                        y: yPricePixel,
                        width: widthAttr,
                        height,
                    });
                }

                return {
                    ...line,
                    labelLocations,
                };
            });

            drawnLabelsRef.current = linesWithLabels;

            if (selectedOrderLine) {
                const focusedLine = linesWithLabels.find(
                    (line) =>
                        line.oid !== undefined &&
                        line.oid === selectedOrderLine.oid,
                );

                if (focusedLine?.labelLocations) {
                    const dpr = window.devicePixelRatio || 1;
                    const borderPadding = 4 * dpr;
                    const borderWidth = 2 * dpr;
                    const borderRadius = 4 * dpr;

                    const labels = focusedLine.labelLocations;
                    if (labels.length > 0) {
                        const minY = Math.min(...labels.map((l) => l.y));
                        const maxY = Math.max(
                            ...labels.map((l) => l.y + l.height),
                        );
                        const x = 0;
                        const y = minY - borderPadding;
                        const width = widthAttr;
                        const height = maxY - minY + borderPadding * 2;

                        ctx.save();

                        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                        ctx.beginPath();
                        ctx.roundRect(x, y, width, height, borderRadius);
                        ctx.fill();

                        ctx.strokeStyle = '#3b82f6';
                        ctx.lineWidth = borderWidth;
                        ctx.beginPath();
                        ctx.rect(x, y, width, height);
                        ctx.stroke();

                        ctx.restore();
                    }
                }
            }
        };

        if (zoomChanged && animationFrameId === null) {
            if (animationFrameId === null) {
                const animate = () => {
                    draw();
                    animationFrameId = requestAnimationFrame(animate);
                };
                animationFrameId = requestAnimationFrame(animate);
            }
        } else {
            draw();
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [
        chart,
        isChartReady,
        JSON.stringify(lines),
        ctx,
        zoomChanged,
        canvasSize,
        activeDragLine,
        selectedOrderLine,
    ]);

    useLayoutEffect(() => {
        if (isMobile) return;

        if (!isDrag) {
            const overlayOffsetX = overlayCanvasMousePositionRef.current.x;
            const overlayOffsetY = overlayCanvasMousePositionRef.current.y;

            const isLabel = findLimitLabelAtPosition(
                overlayOffsetX,
                overlayOffsetY,
                drawnLabelsRef.current,
            );

            if (
                isLabel &&
                isLabel.matchType === 'onLabel' &&
                (isLabel.parentLine.type === 'LIMIT' ||
                    isLabel.parentLine.type === 'PREVIEW_ORDER' ||
                    (isLabel.parentLine.type === 'LIQ' &&
                        isLiqPriceLineDraggable)) &&
                isLabel.label?.type !== 'Cancel'
            ) {
                setShowPlusButton(false);
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.pointerEvents = 'auto';
                }
            } else {
                setShowPlusButton(true);
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.cursor = 'pointer';
                    overlayCanvasRef.current.style.pointerEvents = 'none';
                }
            }
        }
    }, [
        overlayCanvasMousePositionRef.current.x,
        overlayCanvasMousePositionRef.current.y,
        JSON.stringify(drawnLabelsRef.current),
        isDrag,
        isMobile,
    ]);

    useEffect(() => {
        if (isMobile) return;

        if (chart && !isDrag) {
            chart.onChartReady(() => {
                chart
                    .activeChart()
                    .crossHairMoved()
                    .subscribe(null, ({ offsetX, offsetY }) => {
                        if (chart) {
                            const { iframeDoc, paneCanvas } =
                                getPaneCanvasAndIFrameDoc(chart);

                            if (!paneCanvas) return;

                            const rect = paneCanvas?.getBoundingClientRect();

                            if (rect && paneCanvas && offsetX && offsetY) {
                                const cssOffsetX = offsetX - rect.left;
                                const cssOffsetY = offsetY - rect.top;

                                const scaleY =
                                    paneCanvas?.height / rect?.height;
                                const scaleX = paneCanvas.width / rect.width;

                                const overlayOffsetX = cssOffsetX * scaleX;
                                const overlayOffsetY = cssOffsetY * scaleY;

                                const isLabel = findLimitLabelAtPosition(
                                    overlayOffsetX,
                                    overlayOffsetY,
                                    drawnLabelsRef.current,
                                );
                                overlayCanvasMousePositionRef.current = {
                                    x: overlayOffsetX,
                                    y: overlayOffsetY,
                                };

                                const pane = iframeDoc?.querySelector(
                                    '.chart-markup-table.pane',
                                );
                                if (isLabel) {
                                    setShowPlusButton(false);
                                    if (overlayCanvasRef.current) {
                                        if (isLabel.matchType === 'onLabel') {
                                            if (
                                                isLabel.label?.type === 'Cancel'
                                            ) {
                                                if (pane) {
                                                    (
                                                        pane as HTMLElement
                                                    ).style.cursor = 'pointer';
                                                }
                                            } else if (
                                                isLabel.parentLine.type ===
                                                    'PNL' ||
                                                (isLabel.parentLine.type ===
                                                    'LIQ' &&
                                                    !isLiqPriceLineDraggable)
                                            ) {
                                                if (pane) {
                                                    (
                                                        pane as HTMLElement
                                                    ).style.cursor =
                                                        'crosshair';
                                                }
                                            } else {
                                                if (
                                                    isLabel.parentLine.type ===
                                                    'PREVIEW_ORDER'
                                                ) {
                                                    (
                                                        pane as HTMLElement
                                                    ).style.cursor =
                                                        'row-resize';
                                                    overlayCanvasRef.current.style.cursor =
                                                        'row-resize';
                                                }

                                                overlayCanvasRef.current.style.pointerEvents =
                                                    'auto';
                                            }
                                        }

                                        if (isLabel.matchType === 'onLine') {
                                            if (pane) {
                                                (
                                                    pane as HTMLElement
                                                ).style.cursor = 'crosshair';
                                            }
                                        }
                                    }
                                } else {
                                    setShowPlusButton(true);
                                    if (pane) {
                                        (pane as HTMLElement).style.cursor =
                                            'crosshair';
                                    }
                                }
                            }
                        }
                    });
            });
        }
    }, [chart, drawnLabelsRef.current, isDrag, isMobile]);

    useEffect(() => {
        if (!overlayCanvasRef.current || isDrag) return;

        if (!isMobile) return;

        if (!chart) return;
        const { paneCanvas, iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        if (!paneCanvas) return;
        const iframeBody = iframeDoc?.body;
        if (!iframeBody) return;

        const handlePointerDown = (event: PointerEvent) => {
            const rect = paneCanvas.getBoundingClientRect();

            if (rect) {
                const cssOffsetX = event.clientX - rect.left;
                const cssOffsetY = event.clientY - rect.top;

                const scaleY = paneCanvas.height / rect.height;
                const scaleX = paneCanvas.width / rect.width;

                const overlayOffsetX = cssOffsetX * scaleX;
                const overlayOffsetY = cssOffsetY * scaleY;

                const isLabel = findLimitLabelAtPosition(
                    overlayOffsetX,
                    overlayOffsetY,
                    drawnLabelsRef.current,
                );

                overlayCanvasMousePositionRef.current = {
                    x: overlayOffsetX,
                    y: overlayOffsetY,
                };

                if (overlayCanvasRef.current) {
                    if (
                        isLabel &&
                        isLabel.matchType === 'onLabel' &&
                        isLabel.label?.type === 'Confirm' &&
                        isMobile
                    ) {
                        if (isLabel.parentLine.type === 'LIMIT') {
                            limitOrderDragEnd(isLabel);
                        }
                        return;
                    }

                    if (
                        isLabel &&
                        isLabel.matchType === 'onLabel' &&
                        isLabel.label?.type === 'Cancel' &&
                        isMobile &&
                        selectedOrderLine
                    ) {
                        handleCancel(isLabel.parentLine);
                        return;
                    }

                    const isValidMatchType = isMobile
                        ? isLabel?.matchType === 'onLabel' ||
                          isLabel?.matchType === 'onLine'
                        : isLabel?.matchType === 'onLabel';

                    if (
                        isLabel &&
                        isValidMatchType &&
                        isLabel.label?.type !== 'Cancel' &&
                        isLabel.label?.type !== 'Confirm' &&
                        (isLabel.parentLine.type === 'LIMIT' ||
                            isLabel.parentLine.type === 'PREVIEW_ORDER' ||
                            (isLabel.parentLine.type === 'LIQ' &&
                                isLiqPriceLineDraggable))
                    ) {
                        const isAlreadySelected =
                            selectedOrderLine?.oid === isLabel.parentLine.oid;

                        if (isAlreadySelected) return;
                        overlayCanvasRef.current.style.pointerEvents = 'auto';

                        if (isMobile) {
                            setActiveDragLine(isLabel);
                            setSelectedOrderLine({
                                ...isLabel.parentLine,
                                originalPrice: isLabel.parentLine.yPrice,
                            });
                        }

                        if (overlayCanvasRef.current) {
                            overlayCanvasRef.current?.setPointerCapture(
                                event.pointerId,
                            );
                        }
                    } else {
                        overlayCanvasRef.current.style.cursor = 'pointer';
                        setSelectedOrderLine(undefined);
                        setActiveDragLine(undefined);
                    }
                }
            }
        };

        iframeBody.addEventListener('pointerdown', handlePointerDown);

        return () => {
            iframeBody.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [chart, isDrag, drawnLabelsRef.current, isMobile]);

    const handleCancel = async (order: LineData) => {
        setIsCancelClicking(true);

        if (!order.oid) {
            notifications.add({
                title: t('transactions.cancelFailed.title'),
                message: t('transactions.cancelFailed.message'),
                icon: 'error',
            });
            setIsCancelClicking(false);
            return;
        }

        const slug = makeSlug(10);

        const usdValueOfOrderStr = formatNum(
            (order.quantityTextValue || 0) * (symbolInfo?.markPx || 1),
            2,
            true,
            true,
        );
        try {
            // Show pending notification
            notifications.add({
                title: t('transactions.cancelLimitPending.title'),
                message: t('transactions.cancelLimitPending.message', {
                    side: order.side,
                    usdValueOfOrderStr,
                    symbol: symbolInfo?.coin,
                }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });

            const timeOfTxBuildStart = Date.now();
            // Execute the cancel order
            const result = await executeCancelOrder({
                orderId: order.oid,
            });

            if (result.success) {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Cancel Success',
                            orderType: 'Limit',
                            direction: order.side === 'buy' ? 'Buy' : 'Sell',
                            success: true,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show success notification
                notifications.add({
                    title: t('transactions.cancelLimitConfirmed.title'),
                    message: t('transactions.cancelLimitConfirmed.message', {
                        side: order.side,
                        usdValueOfOrderStr,
                        symbol: symbolInfo?.coin,
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Cancel Fail',
                            orderType: 'Limit',
                            direction: order.side === 'buy' ? 'Buy' : 'Sell',
                            success: false,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show error notification
                notifications.add({
                    title: t('transactions.cancelFailed.title'),
                    message: t('transactions.cancelFailed.message2'),
                    icon: 'error',
                    txLink: getTxLink(result.signature),
                });
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            notifications.remove(slug);
            notifications.add({
                title: t('transactions.cancelFailed.title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
            });
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Limit Cancel Fail',
                        orderType: 'Limit',
                        direction: order.side === 'buy' ? 'Buy' : 'Sell',
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
        } finally {
            setIsCancelClicking(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleMouseDown = (params: any) => {
            if (chart) {
                const chartDiv = document.getElementById('tv_chart');
                const iframe = chartDiv?.querySelector(
                    'iframe',
                ) as HTMLIFrameElement;

                const iframeDoc = iframe.contentDocument;

                if (iframeDoc) {
                    const paneCanvas = iframeDoc.querySelector(
                        'canvas[data-name="pane-canvas"]',
                    ) as HTMLCanvasElement;

                    const rect = paneCanvas?.getBoundingClientRect();

                    if (rect && paneCanvas) {
                        const cssOffsetX = params.clientX - rect.left;
                        const cssOffsetY = params.clientY - rect.top;

                        const scaleY = paneCanvas?.height / rect?.height;
                        const scaleX = paneCanvas.width / rect.width;

                        const offsetX = cssOffsetX * scaleX;
                        const offsetY = cssOffsetY * scaleY;

                        const found = findLimitLabelAtPosition(
                            offsetX,
                            offsetY,
                            drawnLabelsRef.current,
                        );

                        if (
                            found &&
                            found.matchType === 'onLabel' &&
                            found.label?.type === 'Cancel' &&
                            !isMobile
                        ) {
                            console.log({ found });
                            if (found.parentLine.oid)
                                handleCancel(found.parentLine);
                            console.log(found.parentLine.textValue);
                        }
                    }
                }
            }
        };
        if (chart) {
            chart.subscribe('mouse_down', handleMouseDown);
        }
        return () => {
            if (chart) {
                try {
                    chart.unsubscribe('mouse_down', handleMouseDown);

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error: unknown) {
                    // console.error({ error });
                }
            }
        };
    }, [chart, JSON.stringify(drawnLabelsRef.current)]);

    useEffect(() => {
        if (!overlayCanvasRef.current) return;
        const canvas = overlayCanvasRef.current;
        const dpr = window.devicePixelRatio || 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragStart = (event: any) => {
            const rect = canvas.getBoundingClientRect();
            const { offsetY, offsetX } = getXandYLocationForChartDrag(
                event,
                rect,
            );

            const isLabel = findLimitLabelAtPosition(
                offsetX * dpr,
                offsetY * dpr,
                drawnLabelsRef.current,
            );

            const isMobile = true;

            const isValidMatchType = isMobile
                ? isLabel?.matchType === 'onLabel' ||
                  isLabel?.matchType === 'onLine'
                : isLabel?.matchType === 'onLabel';

            const shouldStartDrag =
                isLabel &&
                isValidMatchType &&
                isLabel.label?.type !== 'Cancel' &&
                (isLabel.parentLine.type === 'LIMIT' ||
                    (isLabel.parentLine.type === 'LIQ' &&
                        isLiqPriceLineDraggable));

            if (shouldStartDrag) {
                canvas.style.cursor = 'grabbing';
                dragStateRef.current.tempSelectedLine = isLabel;

                if (dragStateRef.current.originalPrice === undefined) {
                    dragStateRef.current.originalPrice =
                        isLabel.parentLine.yPrice;
                }

                dragStateRef.current.isDragging = true;
                setActiveDragLine(isLabel);
                setIsDrag(true);

                // Track mobile order adjustment usage
                if (isMobile && typeof plausible === 'function') {
                    plausible('Mobile Order Adjustment', {
                        props: {
                            method: 'Drag',
                            action: 'Start',
                            orderType: isLabel.parentLine.type,
                        },
                    });
                }
            }

            if (
                isLabel &&
                isLabel.parentLine.type === 'PREVIEW_ORDER' &&
                (isLabel.matchType === 'onLabel' ||
                    isLabel.matchType === 'onLine')
            ) {
                canvas.style.cursor = 'grabbing';
                dragStateRef.current.tempSelectedLine = isLabel;
                dragStateRef.current.originalPrice = isLabel.parentLine.yPrice;
                dragStateRef.current.isDragging = true;
                setIsDrag(true);
                useTradeDataStore.getState().setIsMidModeActive(false);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragging = (event: any) => {
            const { isOutsideArea, frozenPrice } = dragStateRef.current;

            if (isOutsideArea && frozenPrice !== undefined) {
                dragStateRef.current.tempSelectedLine = dragStateRef.current
                    .tempSelectedLine
                    ? {
                          ...dragStateRef.current.tempSelectedLine,
                          parentLine: {
                              ...dragStateRef.current.tempSelectedLine
                                  .parentLine,
                              yPrice: frozenPrice,
                              textValue:
                                  dragStateRef.current.tempSelectedLine
                                      .parentLine.textValue &&
                                  dragStateRef.current.tempSelectedLine
                                      .parentLine.textValue.type === 'Limit'
                                      ? {
                                            ...dragStateRef.current
                                                .tempSelectedLine.parentLine
                                                .textValue,
                                            price: frozenPrice,
                                        }
                                      : dragStateRef.current.tempSelectedLine
                                            .parentLine.textValue,
                          },
                      }
                    : undefined;

                setActiveDragLine(dragStateRef.current.tempSelectedLine);
                return;
            }

            const { offsetY: clientY } = getXandYLocationForChartDrag(
                event,
                canvas.getBoundingClientRect(),
            );

            let advancedValue = scaleData?.yScale.invert(clientY);

            if (chart) {
                const paneIndex = getMainSeriesPaneIndex(chart);
                if (paneIndex === null) return;
                const priceScalePane = chart.activeChart().getPanes()[
                    paneIndex
                ] as IPaneApi;

                const priceScale = priceScalePane.getMainSourcePriceScale();
                if (priceScale) {
                    const isLogarithmic = priceScale.getMode() === 1;
                    if (isLogarithmic) {
                        advancedValue = scaleData.scaleSymlog.invert(clientY);
                    }
                }
            }

            dragStateRef.current.tempSelectedLine = dragStateRef.current
                .tempSelectedLine
                ? {
                      ...dragStateRef.current.tempSelectedLine,
                      parentLine: {
                          ...dragStateRef.current.tempSelectedLine.parentLine,
                          yPrice: advancedValue,
                          textValue:
                              dragStateRef.current.tempSelectedLine.parentLine
                                  .textValue &&
                              dragStateRef.current.tempSelectedLine.parentLine
                                  .textValue.type === 'Limit'
                                  ? {
                                        ...dragStateRef.current.tempSelectedLine
                                            .parentLine.textValue,
                                        price: isMobile
                                            ? advancedValue
                                            : dragStateRef.current
                                                  .tempSelectedLine.parentLine
                                                  .textValue.price,
                                    }
                                  : dragStateRef.current.tempSelectedLine
                                        .parentLine.textValue,
                      },
                  }
                : undefined;

            if (
                dragStateRef.current.tempSelectedLine?.parentLine.type ===
                'PREVIEW_ORDER'
            ) {
                updateYPosition(
                    dragStateRef.current.tempSelectedLine.parentLine.yPrice,
                );
            }
            setActiveDragLine(dragStateRef.current.tempSelectedLine);

            if (isMobile && dragStateRef.current.tempSelectedLine) {
                setSelectedOrderLine({
                    ...dragStateRef.current.tempSelectedLine.parentLine,
                    originalPrice: dragStateRef.current.originalPrice,
                });
            }
        };

        function liqPriceDragEnd(tempSelectedLine: LabelLocationData) {
            console.log(
                'Liq. Price Line dragend',
                tempSelectedLine.parentLine.yPrice,
            );
            setActiveDragLine(undefined);
            setSelectedOrderLine(undefined);
        }

        function updatePreviewOrderPrice(tempSelectedLine: LabelLocationData) {
            const newPrice = tempSelectedLine.parentLine.yPrice;
            useTradeDataStore.getState().setOrderInputPriceValue({
                value: newPrice,
                changeType: 'dragEnd',
            });
        }

        const handleDragEnd = async () => {
            const { tempSelectedLine, originalPrice, isOutsideArea } =
                dragStateRef.current;

            if (!tempSelectedLine || originalPrice === undefined) {
                return;
            }

            const currentPrice = tempSelectedLine.parentLine.yPrice;
            if (currentPrice < 0) {
                const restoredLine = {
                    ...tempSelectedLine,
                    parentLine: {
                        ...tempSelectedLine.parentLine,
                        yPrice: originalPrice,
                        textValue:
                            tempSelectedLine.parentLine.textValue &&
                            tempSelectedLine.parentLine.textValue.type ===
                                'Limit'
                                ? {
                                      ...tempSelectedLine.parentLine.textValue,
                                      price: originalPrice,
                                  }
                                : tempSelectedLine.parentLine.textValue,
                    },
                };
                setActiveDragLine(restoredLine);

                if (restoredLine.parentLine.type === 'PREVIEW_ORDER') {
                    updateYPosition(originalPrice);
                }

                if (isMobile) {
                    setSelectedOrderLine({
                        ...restoredLine.parentLine,
                        originalPrice: originalPrice,
                    });
                }

                dragStateRef.current.tempSelectedLine = undefined;
                dragStateRef.current.originalPrice = undefined;
                dragStateRef.current.isDragging = false;
                dragStateRef.current.isOutsideArea = false;
                dragStateRef.current.frozenPrice = undefined;
                setIsDrag(false);
                setActiveDragLine(undefined);

                if (chart) {
                    const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
                    if (iframeDoc?.body) {
                        iframeDoc.body.style.removeProperty('cursor');
                    }
                    if (iframeDoc?.documentElement) {
                        iframeDoc.documentElement.style.removeProperty(
                            'cursor',
                        );
                    }
                }

                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.cursor = 'pointer';
                    overlayCanvasRef.current.style.pointerEvents = 'none';
                }
                return;
            }

            if (isOutsideArea) {
                const restoredLine = {
                    ...tempSelectedLine,
                    parentLine: {
                        ...tempSelectedLine.parentLine,
                        yPrice: originalPrice,
                        textValue:
                            tempSelectedLine.parentLine.textValue &&
                            tempSelectedLine.parentLine.textValue.type ===
                                'Limit'
                                ? {
                                      ...tempSelectedLine.parentLine.textValue,
                                      price: originalPrice,
                                  }
                                : tempSelectedLine.parentLine.textValue,
                    },
                };
                setActiveDragLine(restoredLine);

                if (restoredLine.parentLine.type === 'PREVIEW_ORDER') {
                    updateYPosition(originalPrice);
                }

                dragStateRef.current.tempSelectedLine = undefined;
                dragStateRef.current.originalPrice = undefined;
                dragStateRef.current.isDragging = false;
                dragStateRef.current.isOutsideArea = false;
                dragStateRef.current.frozenPrice = undefined;
                setIsDrag(false);
                setActiveDragLine(undefined);

                if (chart) {
                    const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
                    if (iframeDoc?.body) {
                        iframeDoc.body.style.removeProperty('cursor');
                    }
                    if (iframeDoc?.documentElement) {
                        iframeDoc.documentElement.style.removeProperty(
                            'cursor',
                        );
                    }
                }

                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.cursor = 'pointer';
                    overlayCanvasRef.current.style.pointerEvents = 'none';
                }
                return;
            }

            let cursorText = 'pointer';

            if (isMobile) {
                // Track drag completion
                if (typeof plausible === 'function') {
                    plausible('Mobile Order Adjustment', {
                        props: {
                            method: 'Drag',
                            action: 'Complete',
                            orderType: tempSelectedLine.parentLine.type,
                        },
                    });
                }
                if (tempSelectedLine.parentLine.type === 'PREVIEW_ORDER') {
                    updatePreviewOrderPrice(tempSelectedLine);
                }

                setSelectedOrderLine({
                    ...tempSelectedLine.parentLine,
                    originalPrice: originalPrice,
                });
            } else {
                if (tempSelectedLine.parentLine.type === 'LIMIT') {
                    limitOrderDragEnd(tempSelectedLine);
                }

                if (tempSelectedLine.parentLine.type === 'LIQ') {
                    liqPriceDragEnd(tempSelectedLine);
                }
                if (tempSelectedLine.parentLine.type === 'PREVIEW_ORDER') {
                    updatePreviewOrderPrice(tempSelectedLine);

                    setActiveDragLine(undefined);
                    setSelectedOrderLine(undefined);
                    cursorText = 'row-resize';
                }
            }

            dragStateRef.current.tempSelectedLine = undefined;
            dragStateRef.current.originalPrice = undefined;
            dragStateRef.current.isDragging = false;
            dragStateRef.current.isOutsideArea = false;
            dragStateRef.current.frozenPrice = undefined;
            setIsDrag(false);

            if (chart) {
                const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
                if (iframeDoc?.body) {
                    iframeDoc.body.style.removeProperty('cursor');
                }
                if (iframeDoc?.documentElement) {
                    iframeDoc.documentElement.style.removeProperty('cursor');
                }
            }

            setTimeout(() => {
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.cursor = cursorText;
                }
            }, 300);
        };

        const dragLines = d3
            .drag<d3.DraggedElementBaseType, unknown, d3.SubjectPosition>()
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
    }, [overlayCanvasRef.current, chart, isSessionEstablished]);

    // Handle ESC key press to cancel drag
    useEffect(() => {
        if (!chart) return;

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && dragStateRef.current.isDragging) {
                const { tempSelectedLine, originalPrice } =
                    dragStateRef.current;

                if (tempSelectedLine && originalPrice !== undefined) {
                    const restoredLine = {
                        ...tempSelectedLine,
                        parentLine: {
                            ...tempSelectedLine.parentLine,
                            yPrice: originalPrice,
                            textValue:
                                tempSelectedLine.parentLine.textValue &&
                                tempSelectedLine.parentLine.textValue.type ===
                                    'Limit'
                                    ? {
                                          ...tempSelectedLine.parentLine
                                              .textValue,
                                          price: originalPrice,
                                      }
                                    : tempSelectedLine.parentLine.textValue,
                        },
                    };
                    setActiveDragLine(restoredLine);

                    if (restoredLine.parentLine.type === 'PREVIEW_ORDER') {
                        updateYPosition(originalPrice);
                    }

                    dragStateRef.current.tempSelectedLine = undefined;
                    dragStateRef.current.originalPrice = undefined;
                    dragStateRef.current.isDragging = false;
                    dragStateRef.current.isOutsideArea = false;
                    dragStateRef.current.frozenPrice = undefined;
                    setIsDrag(false);
                    setActiveDragLine(undefined);

                    if (chart) {
                        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
                        if (iframeDoc?.body) {
                            iframeDoc.body.style.removeProperty('cursor');
                        }
                        if (iframeDoc?.documentElement) {
                            iframeDoc.documentElement.style.removeProperty(
                                'cursor',
                            );
                        }
                    }

                    if (overlayCanvasRef.current) {
                        overlayCanvasRef.current.style.cursor = 'pointer';
                        overlayCanvasRef.current.style.pointerEvents = 'none';
                    }
                }
            }
        };

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        const iframeBody = iframeDoc?.body;

        if (iframeBody) {
            iframeBody.addEventListener('keydown', handleEscapeKey);

            return () => {
                iframeBody.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [chart, overlayCanvasRef.current]);

    // Handle mouse leaving and entering chart during drag
    useEffect(() => {
        if (!chart) return;

        const handleMouseLeave = () => {
            const { isDragging, tempSelectedLine } = dragStateRef.current;

            if (isDragging && tempSelectedLine) {
                dragStateRef.current.frozenPrice =
                    tempSelectedLine.parentLine.yPrice;
                dragStateRef.current.isOutsideArea = true;

                const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
                if (iframeDoc?.body) {
                    iframeDoc.body.style.setProperty(
                        'cursor',
                        'not-allowed',
                        'important',
                    );
                }
                if (iframeDoc?.documentElement) {
                    iframeDoc.documentElement.style.setProperty(
                        'cursor',
                        'not-allowed',
                        'important',
                    );
                }
            }
        };

        const handleMouseEnter = () => {
            const { isDragging } = dragStateRef.current;

            if (isDragging) {
                dragStateRef.current.isOutsideArea = false;
                dragStateRef.current.frozenPrice = undefined;

                const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
                if (iframeDoc?.body) {
                    iframeDoc.body.style.removeProperty('cursor');
                }
                if (iframeDoc?.documentElement) {
                    iframeDoc.documentElement.style.removeProperty('cursor');
                }

                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.cursor = 'grabbing';
                }
            }
        };

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        const iframeBody = iframeDoc?.body;

        if (iframeBody) {
            iframeBody.addEventListener('mouseleave', handleMouseLeave);
            iframeBody.addEventListener('mouseenter', handleMouseEnter);

            return () => {
                iframeBody.removeEventListener('mouseleave', handleMouseLeave);
                iframeBody.removeEventListener('mouseenter', handleMouseEnter);
            };
        }
    }, [chart]);

    return null;
};

export default LabelComponent;
