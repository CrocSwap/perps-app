import { useEffect, useState } from 'react';
import type { LiqProps } from './LiqComponent';
import * as d3fc from 'd3fc';
import * as d3 from 'd3';
import { useLiqudationLines } from './hooks/useLiquidationLines';
import type { IPaneApi } from '~/tv/charting_library';
import { getMainSeriesPaneIndex } from '../overlayCanvas/overlayCanvasUtils';
import { useTradingView } from '~/contexts/TradingviewContext';

export type HorizontalLineData = {
    yPrice: number;
    color: string;
    strokeStyle: string;
    lineWidth: number;
    type: string;
    dash?: number[];
};

const LiqudationLines = ({
    overlayCanvasRef,
    canvasWrapperRef,
    canvasSize,
    scaleData,
    zoomChanged,
}: LiqProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [horizontalLine, setHorizontalLine] = useState<any>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [horizontalLineLogScale, setHorizontalLineLogScale] = useState<any>();

    const lines = useLiqudationLines();
    const { chart } = useTradingView();

    useEffect(() => {
        if (scaleData !== undefined && canvasSize) {
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
                    context.strokeStyle = d.strokeStyle;
                    context.fillStyle = d.strokeStyle;
                    context.lineWidth = d.lineWidth;
                    if (d.dash) context.setLineDash(d.dash);
                    if (d.globalAlpha) context.globalAlpha = d.globalAlpha;
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
                    context.strokeStyle = d.strokeStyle;
                    context.fillStyle = d.strokeStyle;
                    context.lineWidth = d.lineWidth;
                    if (d.dash) context.setLineDash(d.dash);
                    if (d.globalAlpha) context.globalAlpha = d.globalAlpha;
                },
            );
            // const horizontalBand = d3fc
            //     .annotationCanvasBand()
            //     .orient('horizontal')
            //     .yScale(scaleData?.yScale)
            //     .fromValue((d: any) => d[0])
            //     .toValue((d: any) => d[1])
            //     .decorate((context: any) => {
            //         context.fillStyle = 'yellow';
            //     });

            setHorizontalLine(() => {
                return horizontalLine;
            });

            setHorizontalLineLogScale(() => {
                return horizontalLineLogScale;
            });

            // setHorizontalBand(() => {
            //     return horizontalBand;
            // });
        }
    }, [scaleData, canvasSize === undefined]);

    // Update scale range on canvas size change
    useEffect(() => {
        if (scaleData !== undefined && canvasSize && horizontalLine) {
            const dummyXScale = d3
                .scaleLinear()
                .domain([0, 1])
                .range([0, canvasSize.width]);

            horizontalLine.yScale(scaleData.yScale);
            horizontalLine.xScale(dummyXScale);
        }
    }, [scaleData, canvasSize]);

    useEffect(() => {
        if (
            overlayCanvasRef.current &&
            horizontalLine &&
            chart &&
            horizontalLineLogScale
        ) {
            const canvas = overlayCanvasRef.current;
            const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

            horizontalLine.context(ctx);

            let animationId: number;

            const paneIndex = getMainSeriesPaneIndex(chart) || 0;

            const priceScalePane = chart.activeChart().getPanes()[
                paneIndex
            ] as IPaneApi;
            const priceScale = priceScalePane.getMainSourcePriceScale();

            const render = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

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

                if (zoomChanged) {
                    animationId = requestAnimationFrame(render);
                }
            };

            if (zoomChanged) {
                animationId = requestAnimationFrame(render);
            } else {
                render();
            }

            return () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            };
        }
    }, [
        chart,
        horizontalLine,
        horizontalLineLogScale,
        overlayCanvasRef.current === null,
        JSON.stringify(lines),
        JSON.stringify(scaleData?.yScale.domain()),
        zoomChanged,
    ]);

    return null;
};

export default LiqudationLines;
