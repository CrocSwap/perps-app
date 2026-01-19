import * as d3 from 'd3';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './LineChart.module.css';
import { useNumFormatter } from '~/hooks/useNumFormatter';

type CurveType = 'step' | 'basic';

type LineChartProps = {
    lineData: { time: number; value: number }[] | undefined;
    curve: CurveType;
    chartName: string;
    height?: number;
    width?: number;
    isMobile?: boolean;
};

const LineChart: React.FC<LineChartProps> = (props) => {
    const { lineData, chartName, curve, height, width, isMobile } = props;

    const { formatNum } = useNumFormatter();

    const hasData = Array.isArray(lineData) && lineData.length > 0;

    const chartWidth = width || 850;
    const chartHeight = height || 250;

    const xAxisHeight = isMobile ? 24 : 24;

    const [canvasInitialHeight, setCanvasInitialHeight] = React.useState<
        number | undefined
    >();
    const [canvasInitialWidth, setCanvasInitialWidth] = React.useState<
        number | undefined
    >();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const scaleDataRef = useRef<{
        xScale: any;
        yScale: any;
        svgXScale: any;
        svgYScale: any;
    }>({
        xScale: undefined,
        yScale: undefined,
        svgXScale: undefined,
        svgYScale: undefined,
    });

    const yAxisTicksRef = useRef<Array<number> | undefined>(undefined);

    const [yAxisPadding, setYAxisPadding] = React.useState<number>(50);
    const [maxAxisTextWidth, setMaxAxisTextWidth] = React.useState<
        number | undefined
    >(undefined);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineSeries, setLineSeries] = useState<any>();

    const { numFormat } = useAppSettings();

    // Find Y axis ticks
    useEffect(() => {
        if (lineData) {
            if (lineData.length === 0) {
                yAxisTicksRef.current = [0, 1];
                return;
            }
            const minPrice = d3.min(lineData, (d: any) => d.value);
            const maxPrice = d3.max(lineData, (d: any) => d.value);

            if (minPrice !== undefined && maxPrice !== undefined) {
                const tickCount = chartHeight - xAxisHeight > 150 ? 5 : 2;

                const diff = maxPrice - minPrice;

                const padding = diff / 15;

                const ticks = d3.ticks(
                    minPrice - padding,
                    maxPrice + padding,
                    tickCount,
                );

                if (ticks.length < 2) {
                    const adjustedTicks = d3.ticks(
                        minPrice - padding,
                        maxPrice + padding,
                        tickCount + 1,
                    );

                    yAxisTicksRef.current = adjustedTicks;
                } else {
                    yAxisTicksRef.current = ticks;
                }
            }
        }
    }, [lineData, chartName, chartHeight]);

    // Calculate Y axis width based on ticks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        if (yAxisTicksRef.current) {
            const textMeasure: Array<number> = [];

            yAxisTicksRef.current?.forEach((tick) => {
                textMeasure.push(
                    context.measureText(
                        formatNum(tick as number, null, true, true),
                    ).width,
                );
            });

            const maxTextWidth = d3.max(textMeasure);

            if (maxTextWidth && maxAxisTextWidth !== maxTextWidth)
                setMaxAxisTextWidth(() => maxTextWidth + maxTextWidth / 1.5);
        }
    }, [yAxisTicksRef.current, maxAxisTextWidth]);

    useEffect(() => {
        if (maxAxisTextWidth && maxAxisTextWidth > yAxisPadding) {
            setYAxisPadding(() => Math.max(50, maxAxisTextWidth));
        }
    }, [maxAxisTextWidth]);

    useEffect(() => {
        if (lineData === undefined) return;
        if (yAxisTicksRef.current === undefined || yAxisPadding === undefined)
            return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const now = Date.now();
        const defaultMinDate = now - 7 * 24 * 60 * 60 * 1000;
        const defaultMaxDate = now;

        const minDate = hasData
            ? d3.min(lineData, (d: any) => d.time)
            : defaultMinDate;
        const maxDate = hasData
            ? d3.max(lineData, (d: any) => d.time)
            : defaultMaxDate;

        // Scales
        if (minDate && maxDate && lineData) {
            const diff = maxDate - minDate;

            const padding = diff / 40;

            const xScale = d3
                .scaleTime()
                .domain([new Date(minDate), new Date(maxDate + padding)]);

            const svgXScale = xScale.copy();

            svgXScale.range([0, chartWidth - yAxisPadding]);
            xScale.range([0, chartWidth - yAxisPadding]);

            scaleDataRef.current.xScale = xScale;
            scaleDataRef.current.svgXScale = svgXScale;
        }

        const minPrice = hasData ? d3.min(lineData, (d: any) => d.value) : 0;
        const maxPrice = hasData ? d3.max(lineData, (d: any) => d.value) : 1;

        if (minPrice !== undefined && maxPrice !== undefined) {
            const diff = maxPrice - minPrice;

            const padding = diff / 15;

            const roundedMax = d3.max(yAxisTicksRef.current);
            const roundedMin = d3.min(yAxisTicksRef.current);

            if (roundedMax !== undefined && roundedMin !== undefined) {
                const topBoundaryCanFit =
                    maxPrice +
                    padding *
                        (maxPrice + padding - roundedMax < padding ? 2 : 1);

                const bottomBoundaryCanFit =
                    minPrice -
                    padding *
                        (minPrice - padding - roundedMin < padding ? 2 : 1);

                const yScale = d3
                    .scaleLinear()
                    .domain([bottomBoundaryCanFit, topBoundaryCanFit]);

                const svgYScale = yScale.copy();

                svgYScale.range([chartHeight - xAxisHeight, 0]);
                yScale.range([chartHeight - xAxisHeight, 0]);

                scaleDataRef.current.yScale = yScale;
                scaleDataRef.current.svgYScale = svgYScale;
            }
        }
    }, [yAxisTicksRef.current !== undefined, yAxisPadding, lineData]);

    useEffect(() => {
        if (yAxisPadding === undefined) return;

        setCanvasInitialHeight(() => chartHeight - xAxisHeight);
        setCanvasInitialWidth(() => chartWidth - yAxisPadding);
    }, [yAxisPadding]);

    useEffect(() => {
        if (scaleDataRef.current) {
            scaleDataRef.current.yScale &&
                scaleDataRef.current.yScale.range([
                    chartHeight - xAxisHeight,
                    0,
                ]);
            scaleDataRef.current.xScale &&
                scaleDataRef.current.xScale.range([
                    0,
                    chartWidth - yAxisPadding,
                ]);

            scaleDataRef.current.svgYScale &&
                scaleDataRef.current.svgYScale.range([
                    chartHeight - xAxisHeight,
                    0,
                ]);
            scaleDataRef.current.svgXScale &&
                scaleDataRef.current.svgXScale.range([
                    0,
                    chartWidth - yAxisPadding,
                ]);
        }
    }, [chartHeight, chartWidth, scaleDataRef]);

    useEffect(() => {
        const svgXAxis = d3.select('#xAxis' + (isMobile ? 'Mobile' : ''));
        const svgYAxis = d3.select('#yAxis' + (isMobile ? 'Mobile' : ''));

        const fillStyle = 'var(--text1)';
        const font = 'var(--font-family-main)';
        const fontSize = 'var(--font-size-s)';

        if (scaleDataRef.current && scaleDataRef.current.svgXScale) {
            svgXAxis.select('g').remove();

            const tickScale = scaleDataRef.current.svgXScale.copy();

            const diff =
                scaleDataRef.current.svgXScale.domain()[1].getTime() -
                scaleDataRef.current.svgXScale.domain()[0].getTime();

            const padding = diff / 40;

            tickScale.domain([
                new Date(
                    scaleDataRef.current.svgXScale.domain()[0].getTime() +
                        padding,
                ),
                new Date(
                    scaleDataRef.current.svgXScale.domain()[1].getTime() -
                        padding,
                ),
            ]);

            svgXAxis
                .append('g')
                .call(d3.axisBottom(tickScale).ticks(4))
                .select('.domain')
                .remove();

            svgXAxis.selectAll('line').remove();

            svgXAxis
                .select('g')
                .selectAll('text')
                .attr('fill', fillStyle)
                .attr('shape-rendering', 'crispEdges')
                .style('font-family', font)
                .style('font-size', fontSize);
        }

        if (
            scaleDataRef.current.svgYScale &&
            yAxisTicksRef.current &&
            yAxisPadding
        ) {
            svgYAxis.select('g').remove();

            svgYAxis
                .append('g')
                .attr('id', 'yAxisGroup')
                .call(
                    d3
                        .axisLeft(scaleDataRef.current.svgYScale)
                        .tickValues(yAxisTicksRef.current)
                        .tickFormat((d: any) =>
                            formatNum(d as number, null, true, true),
                        ),
                )
                .select('.domain')
                .remove();

            svgYAxis.selectAll('line').remove();

            svgYAxis
                .select('g')
                .selectAll('text')
                .attr('fill', fillStyle)
                .attr('x', 10)
                .attr('shape-rendering', 'crispEdges')
                .style('font-family', font)
                .style('text-anchor', 'start')
                .style('font-size', fontSize);
        }
    }, [
        scaleDataRef.current,
        scaleDataRef.current,
        numFormat,
        yAxisTicksRef.current,
        yAxisPadding,
        chartHeight,
        chartWidth,
    ]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const xScale = scaleDataRef.current.xScale;
        const yScale = scaleDataRef.current.yScale;

        if (!xScale || !yScale) return;

        if (!hasData) return;

        const lineSeries = d3
            .line()
            .x((d: any) => xScale(new Date(d.time)))
            .y((d: any) => yScale(d.value))
            .curve(curve === 'step' ? d3.curveStep : d3.curveBasis)
            .context(context);

        setLineSeries(() => lineSeries);
    }, [curve, canvasInitialHeight, canvasInitialWidth, lineData, hasData]);

    useEffect(() => {
        if (
            scaleDataRef.current &&
            lineData &&
            canvasInitialHeight &&
            canvasInitialWidth
        ) {
            const xScale = scaleDataRef.current.xScale;
            const yScale = scaleDataRef.current.yScale;

            if (!xScale || !yScale) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            const width = chartWidth || canvas.getBoundingClientRect()?.width;
            const height =
                chartHeight || canvas.getBoundingClientRect()?.height;

            canvas.width = width - yAxisPadding;
            canvas.height = height - xAxisHeight;

            context.scale(1, 1);

            context.clearRect(0, 0, width, height - xAxisHeight);

            if (hasData && lineSeries) {
                context.beginPath();
                lineSeries(lineData);
                context.lineWidth = 2;
                context.strokeStyle = '#7371fc';
                context.stroke();
            }

            yAxisTicksRef.current?.forEach((tick) => {
                context.moveTo(xScale(xScale.domain()[0]), yScale(tick));
                context.lineTo(xScale(xScale.domain()[1]), yScale(tick));
            });

            context.strokeStyle = 'rgba(189,189,189,0.15)';
            context.lineWidth = 2;
            context.stroke();
        }
    }, [lineSeries, lineData, chartHeight, chartWidth, hasData]);

    return (
        <div style={{ height: '100%' }}>
            {yAxisPadding !== undefined &&
                canvasInitialWidth !== undefined &&
                canvasInitialHeight !== undefined && (
                    <div
                        className={styles.chartWrapper}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <div
                            className={styles.chartContainer}
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    chartWidth -
                                    yAxisPadding +
                                    'px ' +
                                    yAxisPadding +
                                    'px',
                            }}
                        >
                            {canvasInitialHeight && canvasInitialWidth && (
                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        // minWidth: '100px',
                                        // minHeight: '100px',
                                        height:
                                            chartHeight - xAxisHeight + 'px',
                                        width: chartWidth - yAxisPadding + 'px',
                                        maxHeight:
                                            chartHeight - xAxisHeight + 'px',
                                        maxWidth:
                                            chartWidth - yAxisPadding + 'px',
                                    }}
                                    width={canvasInitialWidth}
                                    height={canvasInitialHeight}
                                />
                            )}

                            <svg
                                id={`yAxis${isMobile ? 'Mobile' : ''}`}
                                style={{
                                    minHeight: '100px',
                                    width: yAxisPadding + 'px',
                                    height: chartHeight - xAxisHeight + 'px',
                                }}
                                height={chartHeight - xAxisHeight}
                                width={yAxisPadding}
                            />
                        </div>
                        <div
                            className={styles.xAxisContainer}
                            style={{
                                height: xAxisHeight + 'px',
                                width: chartWidth + 'px',
                            }}
                        >
                            <svg
                                id={`xAxis${isMobile ? 'Mobile' : ''}`}
                                height={xAxisHeight}
                                width={chartWidth}
                                style={{ paddingRight: yAxisPadding }}
                            />
                        </div>
                    </div>
                )}
        </div>
    );
};

export default LineChart;
