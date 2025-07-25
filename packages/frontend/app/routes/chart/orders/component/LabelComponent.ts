import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import {
    findLimitLabelAtPosition,
    getXandYLocationForChartDrag,
    type LabelLocationData,
} from '../../overlayCanvas/overlayCanvasUtils';
import {
    formatLineLabel,
    getPricetoPixel,
    quantityTextFormatWithComma,
} from '../customOrderLineUtils';
import { drawLabel, drawLiqLabel, type LabelType } from '../orderLineUtils';
import type { LineData } from './LineComponent';
import type { IPaneApi } from '~/tv/charting_library';

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

    const ctx = overlayCanvasRef.current?.getContext('2d');

    const [isDrag, setIsDrag] = useState(false);
    useEffect(() => {
        if (!chart || !isChartReady || !ctx || !canvasSize) return;

        let animationFrameId: number | null = null;

        const draw = () => {
            let heightAttr = canvasSize?.height;
            let widthAttr = canvasSize?.width;

            if (overlayCanvasRef.current) {
                const chartDiv = document.getElementById('tv_chart');
                const iframe = chartDiv?.querySelector(
                    'iframe',
                ) as HTMLIFrameElement;
                const iframeDoc =
                    iframe?.contentDocument || iframe?.contentWindow?.document;

                if (iframeDoc) {
                    const paneCanvas = iframeDoc.querySelector(
                        'canvas[data-name="pane-canvas"]',
                    ) as HTMLCanvasElement;
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
    ]);

    useEffect(() => {
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
        overlayCanvasMousePositionRef.current,
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
                            const chartDiv =
                                document.getElementById('tv_chart');
                            const iframe = chartDiv?.querySelector(
                                'iframe',
                            ) as HTMLIFrameElement;

                            const iframeDoc = iframe.contentDocument;

                            if (iframeDoc) {
                                const paneCanvas = iframeDoc.querySelector(
                                    'canvas[data-name="pane-canvas"]',
                                ) as HTMLCanvasElement;

                                const rect =
                                    paneCanvas?.getBoundingClientRect();

                                if (rect && paneCanvas && offsetX && offsetY) {
                                    const cssOffsetX = offsetX - rect.left;
                                    const cssOffsetY = offsetY - rect.top;

                                    const scaleY =
                                        paneCanvas?.height / rect?.height;
                                    const scaleX =
                                        paneCanvas.width / rect.width;

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
                        }
                    });
            });
        }
    }, [chart, drawnLabelsRef.current, isDrag]);

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
                canvas.getBoundingClientRect(),
            );

            let advancedValue = scaleData?.yScale.invert(clientY);

            if (chart) {
                const priceScalePane = chart
                    .activeChart()
                    .getPanes()[0] as IPaneApi;

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

        const handleDragEnd = () => {
            console.log('dragend', {
                orderId: tempSelectedLine?.parentLine.oid,
                originalPrice: originalPrice,
                draggedPrice: tempSelectedLine?.parentLine.yPrice,
            });
            tempSelectedLine = undefined;
            setSelectedLine(undefined);
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
