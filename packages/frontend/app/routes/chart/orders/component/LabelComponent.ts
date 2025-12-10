import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import type { LimitOrderParams } from '~/services/limitOrderService';
import { makeSlug, useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
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
import { drawLabel, drawLiqLabel, type LabelType } from '../orderLineUtils';
import type { LineData } from './LineComponent';
import { t } from 'i18next';

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
    selectedLine: LabelLocationData | undefined;
    setSelectedLine: React.Dispatch<
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
    selectedLine,
    setSelectedLine,
    overlayCanvasMousePositionRef,
}: LabelProps) => {
    const { chart, isChartReady } = useTradingView();

    const notifications = useNotificationStore();

    const { formatNum } = useNumFormatter();

    const symbolInfo = useTradeDataStore((state) => state.symbolInfo);

    const { executeCancelOrder } = useCancelOrderService();
    const { executeLimitOrder } = useLimitOrderService();
    const ctx = overlayCanvasRef.current?.getContext('2d');

    const [isDrag, setIsDrag] = useState(false);

    const isLiqPriceLineDraggable = false;

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

                const labelOptions = [
                    {
                        type: 'Main' as LabelType,
                        text: formatLineLabel(line.textValue),
                        backgroundColor: '#D1D1D1',
                        textColor: '#3C91FF',
                        borderColor: line.color,
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

                let labelLocations = [];

                if (line.type !== 'LIQ') {
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

                return {
                    ...line,
                    labelLocations,
                };
            });

            drawnLabelsRef.current = linesWithLabels;
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
        selectedLine,
    ]);

    useLayoutEffect(() => {
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
                    (isLabel.parentLine.type === 'LIQ' &&
                        isLiqPriceLineDraggable)) &&
                isLabel.label.type !== 'Cancel'
            ) {
                if (overlayCanvasRef.current)
                    overlayCanvasRef.current.style.pointerEvents = 'auto';
            } else {
                if (overlayCanvasRef.current)
                    overlayCanvasRef.current.style.pointerEvents = 'none';
            }
        }
    }, [
        overlayCanvasMousePositionRef.current.x,
        overlayCanvasMousePositionRef.current.y,
        JSON.stringify(drawnLabelsRef.current),
        isDrag,
    ]);

    useEffect(() => {
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

                                if (isLabel) {
                                    const pane = iframeDoc?.querySelector(
                                        '.chart-markup-table.pane',
                                    );

                                    if (overlayCanvasRef.current) {
                                        if (isLabel.matchType === 'onLabel') {
                                            if (
                                                isLabel.label.type === 'Cancel'
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
                                }
                            }
                        }
                    });
            });
        }
    }, [chart, drawnLabelsRef.current, isDrag]);

    const handleCancel = async (order: LineData) => {
        if (!order.oid) {
            notifications.add({
                title: t('transactions.cancelFailed.title'),
                message: t('transactions.cancelFailed.message'),
                icon: 'error',
            });
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
                            found.label.type === 'Cancel'
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

    function roundDownToTenth(value: number) {
        return Math.floor(value * 10) / 10;
    }

    useEffect(() => {
        if (!overlayCanvasRef.current) return;
        let tempSelectedLine: LabelLocationData | undefined = undefined;
        const canvas = overlayCanvasRef.current;
        let originalPrice: number | undefined = undefined;
        const dpr = window.devicePixelRatio || 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragStart = (event: any) => {
            const rect = canvas.getBoundingClientRect();
            const offsetY = (event.sourceEvent.clientY - rect?.top) * dpr;
            const offsetX = (event.sourceEvent.clientX - rect?.left) * dpr;

            const isLabel = findLimitLabelAtPosition(
                offsetX,
                offsetY,
                drawnLabelsRef.current,
            );

            if (
                isLabel &&
                isLabel.matchType === 'onLabel' &&
                isLabel.label.type !== 'Cancel' &&
                (isLabel.parentLine.type === 'LIMIT' ||
                    (isLabel.parentLine.type === 'LIQ' &&
                        isLiqPriceLineDraggable))
            ) {
                canvas.style.cursor = 'grabbing';
                tempSelectedLine = isLabel;
                originalPrice = isLabel.parentLine.yPrice;
                setSelectedLine(isLabel);
                setIsDrag(true);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDragging = (event: any) => {
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

            tempSelectedLine = tempSelectedLine
                ? {
                      ...tempSelectedLine,
                      parentLine: {
                          ...tempSelectedLine.parentLine,
                          yPrice: advancedValue,
                      },
                  }
                : undefined;

            setSelectedLine(tempSelectedLine);
        };

        async function limitOrderDragEnd(tempSelectedLine: LabelLocationData) {
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

                // If cancel was successful, create a new order with the updated price
                // Note: You'll need to provide the correct order parameters based on your application's needs
                const newOrderParams: LimitOrderParams = {
                    // Example parameters - replace with actual parameters from your order
                    price: roundDownToTenth(newPrice),
                    // Add other required parameters for the limit order
                    // For example:
                    // symbol: 'BTC/USD',
                    side,
                    quantity: quantity,
                    replaceOrderId: BigInt(orderId),
                    // ... other required parameters
                } as LimitOrderParams; // Cast to the correct type

                const timeOfTxBuildStart = Date.now();
                const limitOrderResult =
                    await executeLimitOrder(newOrderParams);

                if (!limitOrderResult.success) {
                    setSelectedLine(undefined);
                    console.error(
                        'Failed to create new order:',
                        limitOrderResult.error,
                    );
                    // Show error notification to user
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
                    // Show success notification
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
                setSelectedLine(undefined);
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
        }

        function liqPriceDragEnd(tempSelectedLine: LabelLocationData) {
            console.log(
                'Liq. Price Line dragend',
                tempSelectedLine.parentLine.yPrice,
            );
            setSelectedLine(undefined);
        }

        const handleDragEnd = async () => {
            if (!tempSelectedLine || originalPrice === undefined) {
                return;
            }

            if (tempSelectedLine.parentLine.type === 'LIMIT') {
                limitOrderDragEnd(tempSelectedLine);
            }

            if (tempSelectedLine.parentLine.type === 'LIQ') {
                liqPriceDragEnd(tempSelectedLine);
            }
            tempSelectedLine = undefined;
            setIsDrag(false);
            setTimeout(() => {
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.cursor = 'pointer';
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
    }, [overlayCanvasRef.current, chart, selectedLine, drawnLabelsRef.current]);

    return null;
};

export default LabelComponent;
