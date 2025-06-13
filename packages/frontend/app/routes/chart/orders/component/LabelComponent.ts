import { useEffect, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import {
    formatLineLabel,
    getPricetoPixel,
    quantityTextFormatWithComma,
} from '../customOrderLineUtils';
import {
    drawLabel,
    type LabelLocation,
    type LabelType,
} from '../orderLineUtils';
import type { LineData } from './LineComponent';

interface LabelProps {
    lines: LineData[];
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    zoomChanged: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
}

const LabelComponent = ({
    lines,
    overlayCanvasRef,
    zoomChanged,
    canvasSize,
}: LabelProps) => {
    const { chart, isChartReady } = useTradingView();

    const ctx = overlayCanvasRef.current?.getContext('2d');

    const [drawnLabels, setDrawnLabels] = useState<LineData[]>([]);

    useEffect(() => {
        if (!chart || !isChartReady || !ctx) return;

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
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas?.height);

            const linesWithLabels = lines.map((line) => {
                const yPricePixel = getPricetoPixel(
                    chart,
                    line.yPrice,
                    heightAttr,
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

                const labelLocations = drawLabel(ctx, {
                    x: xPixel,
                    y: yPricePixel,
                    labelOptions,
                });

                return {
                    ...line,
                    labelLocations,
                };
            });

            setDrawnLabels(linesWithLabels);
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
    ]);

    function findCancelLabelAtPosition(
        x: number,
        y: number,
        drawnLabels: LineData[],
    ): { label: LabelLocation; parentLine: (typeof drawnLabels)[0] } | null {
        for (let i = drawnLabels.length - 1; i >= 0; i--) {
            const labelLocs = drawnLabels[i].labelLocations;
            if (!labelLocs) continue;

            for (const loc of labelLocs) {
                if (loc.type === 'Cancel') {
                    const startX = loc.x;
                    const endX = loc.x + loc.width;
                    const startY = loc.y;
                    const endY = loc.y + loc?.height;

                    if (x >= startX && x <= endX && y >= startY && y <= endY) {
                        return { label: loc, parentLine: drawnLabels[i] };
                    }
                }
            }
        }
        return null;
    }

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

                        const found = findCancelLabelAtPosition(
                            offsetX,
                            offsetY,
                            drawnLabels,
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
    }, [chart, JSON.stringify(drawnLabels)]);

    return null;
};

export default LabelComponent;
