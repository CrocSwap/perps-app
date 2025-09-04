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
import { blockExplorer } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getDurationSegment';
import packageJson from '../../../../../package.json';
import {
    findLimitLabelAtPosition,
    getMainSeriesPaneIndex,
    getPaneCanvasAndIFrameDoc,
    getXandYLocationForChartDrag,
    updateOverlayCanvasSize,
    type LabelLocationData,
} from '../../overlayCanvas/overlayCanvasUtils';
import {
    formatLineLabel,
    getPricetoPixel,
    quantityTextFormatWithComma,
} from '../customOrderLineUtils';
import { drawLabel, drawLiqLabel, type LabelType } from '../orderLineUtils';
import type { LineData } from './LineComponent';
import * as d3fc from 'd3fc';

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [horizontalLine, setHorizontalLine] = useState<any>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [horizontalLineLogScale, setHorizontalLineLogScale] = useState<any>();

    const [isDrag, setIsDrag] = useState(false);

    useEffect(() => {
        if (scaleData !== undefined && canvasSize && isChartReady) {
            const dummyXScale = d3
                .scaleLinear()
                .domain([0, 1])
                .range([0, canvasSize.width]);

            const horizontalLine = d3fc
                .annotationCanvasLine()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .value((d: any) => d.yPrice)
                .yScale(scaleData?.yScale)
                .xScale(dummyXScale)
                .orient('horizontal')
                .label('');
            horizontalLine.decorate(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (context: CanvasRenderingContext2D, d: any) => {
                    context.strokeStyle = d.color;
                    context.fillStyle = d.color;
                    context.lineWidth = d.lineWidth;
                    if (d.dash) {
                        context.setLineDash(d.dash);
                    }
                },
            );

            const horizontalLineLogScale = d3fc
                .annotationCanvasLine()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .value((d: any) => d.yPrice)
                .yScale(scaleData?.scaleSymlog)
                .xScale(dummyXScale)
                .orient('horizontal')
                .label('');

            horizontalLineLogScale.decorate(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (context: CanvasRenderingContext2D, d: any) => {
                    context.strokeStyle = d.color;
                    context.fillStyle = d.color;
                    context.lineWidth = d.lineWidth;
                    if (d.dash) {
                        context.setLineDash(d.dash);
                    }
                },
            );

            setHorizontalLine(() => {
                return horizontalLine;
            });

            setHorizontalLineLogScale(() => {
                return horizontalLineLogScale;
            });
        }
    }, [scaleData, canvasSize === undefined, isChartReady]);

    useEffect(() => {
        if (!chart || !isChartReady || !ctx || !canvasSize) return;

        let animationFrameId: number | null = null;

        const draw = () => {
            const heightAttr = canvasSize?.height;
            const widthAttr = canvasSize?.width;

            if (overlayCanvasRef.current) {
                updateOverlayCanvasSize(overlayCanvasRef.current, canvasSize);
                const { iframeDoc, paneCanvas } =
                    getPaneCanvasAndIFrameDoc(chart);

                if (!iframeDoc || !paneCanvas || !paneCanvas.parentNode) return;
            }
            drawnLabelsRef.current.map((i) => {
                const data = i.labelLocations;
                data?.forEach((item) => {
                    ctx.clearRect(0, item.y, canvasSize.width, item.height);
                });
            });

            const paneIndex = getMainSeriesPaneIndex(chart);
            if (paneIndex === null)
                return { pixel: 0, chartHeight: 0, textHeight: 0 };
            const priceScalePane = chart.activeChart().getPanes()[
                paneIndex
            ] as IPaneApi;
            const priceScale = priceScalePane.getMainSourcePriceScale();
            if (priceScale) {
                const isLogarithmic = priceScale.getMode() === 1;

                if (horizontalLineLogScale && isLogarithmic) {
                    horizontalLineLogScale.context(ctx);
                    horizontalLineLogScale(lines);
                } else if (horizontalLine) {
                    horizontalLine.context(ctx);
                    horizontalLine(lines);
                }
            }
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
                    ...(line.quantityTextValue
                        ? [
                              {
                                  type: 'Quantity' as LabelType,
                                  text: quantityTextFormatWithComma(
                                      line.quantityTextValue,
                                  ),
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
                    labelLocations = drawLabel(ctx, {
                        x: xPixel,
                        y: yPricePixel,
                        labelOptions,
                    });
                } else {
                    labelLocations = drawLiqLabel(
                        ctx,
                        {
                            x: xPixel,
                            y: yPricePixel,
                            labelOptions,
                        },
                        canvasSize.width,
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
        horizontalLine,
        horizontalLineLogScale,
        scaleData?.yScale.domain(),
    ]);

    useLayoutEffect(() => {
        if (!isDrag) {
            const overlayOffsetX = overlayCanvasMousePositionRef.current.x;
            const overlayOffsetY = overlayCanvasMousePositionRef.current.y;

            const isLabel = findLimitLabelAtPosition(
                overlayOffsetX,
                overlayOffsetY,
                drawnLabelsRef.current,
                false,
            );

            if (isLabel) {
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
                            const { paneCanvas } =
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
                                    false,
                                );
                                overlayCanvasMousePositionRef.current = {
                                    x: overlayOffsetX,
                                    y: overlayOffsetY,
                                };

                                if (isLabel) {
                                    if (overlayCanvasRef.current)
                                        overlayCanvasRef.current.style.pointerEvents =
                                            'auto';
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
                title: 'Cancel Failed',
                message: 'Order ID not found',
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
                title: 'Cancel Order Pending',
                message: `Cancelling ${order.side} limit order for ${usdValueOfOrderStr} of ${symbolInfo?.coin}`,
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
                            version: packageJson.version,
                            actionType: 'Limit Cancel Success',
                            orderType: 'Limit',
                            direction: order.side === 'buy' ? 'Buy' : 'Sell',
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
                    title: 'Order Cancelled',
                    message: `Successfully cancelled ${order.side} limit order for ${usdValueOfOrderStr} of ${symbolInfo?.coin}`,
                    icon: 'check',
                    txLink: result.signature
                        ? blockExplorer + result.signature
                        : undefined,
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Cancel Fail',
                            orderType: 'Limit',
                            direction: order.side === 'buy' ? 'Buy' : 'Sell',
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
                    title: 'Cancel Failed',
                    message: String(result.error || 'Failed to cancel order'),
                    icon: 'error',
                    txLink: result.signature
                        ? blockExplorer + result.signature
                        : undefined,
                });
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            notifications.remove(slug);
            notifications.add({
                title: 'Cancel Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
            });
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        version: packageJson.version,
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
                            true,
                        );

                        if (found) {
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
                false,
            );

            if (isLabel) {
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
                dpr,
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

        const handleDragEnd = async () => {
            if (
                !tempSelectedLine ||
                originalPrice === undefined ||
                tempSelectedLine.parentLine.oid === undefined ||
                tempSelectedLine.parentLine.side === undefined
            ) {
                return;
            }

            const orderId = tempSelectedLine.parentLine.oid;
            const newPrice = tempSelectedLine.parentLine.yPrice;
            const quantity = tempSelectedLine.parentLine.quantityTextValue;
            const side = tempSelectedLine.parentLine.side;

            const slug = makeSlug(10);

            try {
                const usdValueOfOrderStr = formatNum(
                    (quantity || 0) * (symbolInfo?.markPx || 1),
                    2,
                    true,
                    true,
                );
                // Show pending notification
                notifications.add({
                    title: 'Limit Order Update Pending',
                    message: `Updating ${side} order for ${usdValueOfOrderStr} of ${symbolInfo?.coin} at ${formatNum(roundDownToTenth(newPrice), newPrice > 10_000 ? 0 : 2, true, true)}`,
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
                                version: packageJson.version,
                                actionType: 'Limit Update Fail',
                                orderType: 'Limit',
                                direction: side === 'buy' ? 'Buy' : 'Sell',
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
                        title: 'Failed to update order',
                        message:
                            limitOrderResult.error || 'Unknown error occurred',
                        icon: 'error',
                        removeAfter: 10000,
                        txLink: limitOrderResult.signature
                            ? `${blockExplorer}/tx/${limitOrderResult.signature}`
                            : undefined,
                    });
                } else {
                    // Show success notification
                    notifications.remove(slug);
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                version: packageJson.version,
                                actionType: 'Limit Update Success',
                                orderType: 'Limit',
                                direction: side === 'buy' ? 'Buy' : 'Sell',
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
                        title: 'Order updated',
                        message: `Successfully updated order for ${usdValueOfOrderStr} of ${symbolInfo?.coin} at ${formatNum(roundDownToTenth(newPrice), newPrice > 10_000 ? 0 : 2, true, true)}`,
                        icon: 'check',
                        removeAfter: 10000,
                        txLink: limitOrderResult.signature
                            ? `${blockExplorer}/tx/${limitOrderResult.signature}`
                            : undefined,
                    });
                }
            } catch (error) {
                setSelectedLine(undefined);
                console.error('Error updating order:', error);
                notifications.remove(slug);
                notifications.add({
                    title: 'Error updating order',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error occurred',
                    icon: 'error',
                });
                if (typeof plausible === 'function') {
                    plausible('Offchain Failure', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Update Fail',
                            orderType: 'Limit',
                            direction: side === 'buy' ? 'Buy' : 'Sell',
                            errorMessage:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error occurred',
                        },
                    });
                }
            }

            tempSelectedLine = undefined;
            setIsDrag(false);
            setTimeout(() => {
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.style.pointerEvents = 'none';
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
