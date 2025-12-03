import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './LineChart.module.css';

type CurveType = 'step' | 'basic';

type LineChartProps = {
    lineData: { time: number; value: number }[] | undefined;
    curve: CurveType;
    chartName: string;
    height?: number;
    width?: number;
};

const LineChart: React.FC<LineChartProps> = (props) => {
    const { lineData, chartName, curve, height, width } = props;

    const chartWidth = width || 850;
    const chartHeight = height || 250;

    const [canvasInitialHeight, setCanvasInitialHeight] = React.useState<
        number | undefined
    >();
    const [canvasInitialWidth, setCanvasInitialWidth] = React.useState<
        number | undefined
    >();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const scaleDataRef = useRef<{
        xScale: d3.ScaleTime<number, number> | undefined;
        yScale: d3.ScaleLinear<number, number> | undefined;
        svgXScale: d3.ScaleTime<number, number> | undefined;
        svgYScale: d3.ScaleLinear<number, number> | undefined;
    }>({
        xScale: undefined,
        yScale: undefined,
        svgXScale: undefined,
        svgYScale: undefined,
    });

    const yAxisTicksRef = useRef<Array<number> | undefined>(undefined);

    const [yAxisPadding, setYAxisPadding] = React.useState<number>(50);

    const { numFormat } = useAppSettings();

    // Find Y axis ticks
    useEffect(() => {
        if (lineData) {
            const minPrice = d3.min(lineData, (d) => d.value);
            const maxPrice = d3.max(lineData, (d) => d.value);

            if (minPrice !== undefined && maxPrice !== undefined) {
                const tickCount = Math.max(chartHeight - 50, 100) > 150 ? 5 : 2;

                const diff = maxPrice - minPrice;

                const padding = diff / 15;

                const ticks = d3.ticks(
                    minPrice - padding,
                    maxPrice + padding,
                    tickCount,
                );

                yAxisTicksRef.current = ticks;
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
                    context.measureText(d3.format(',')(tick)).width,
                );
            });

            const maxTextWidth = d3.max(textMeasure);

            maxTextWidth &&
                setYAxisPadding(() => maxTextWidth + maxTextWidth / 1.5);
        }
    }, [yAxisTicksRef.current]);

    useEffect(() => {
        if (lineData === undefined) return;
        if (yAxisTicksRef.current === undefined || yAxisPadding === undefined)
            return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;

        const minDate = d3.min(lineData, (d) => d.time);
        const maxDate = d3.max(lineData, (d) => d.time);

        // Scales
        if (minDate && maxDate && lineData) {
            const diff = maxDate - minDate;

            const padding = diff / 40;

            const xScale = d3
                .scaleTime()
                .domain([new Date(minDate), new Date(maxDate + padding)]);

            const svgXScale = xScale.copy();

            svgXScale.range([0, chartWidth - yAxisPadding]);
            xScale.range([0, (chartWidth - yAxisPadding) * dpr]);

            scaleDataRef.current.xScale = xScale;
            scaleDataRef.current.svgXScale = svgXScale;
        }

        const minPrice = d3.min(lineData, (d) => d.value);
        const maxPrice = d3.max(lineData, (d) => d.value);

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

                svgYScale.range([Math.max(chartHeight - 50, 100), 0]);
                yScale.range([(chartHeight - 50) * dpr, 0]);

                scaleDataRef.current.yScale = yScale;
                scaleDataRef.current.svgYScale = svgYScale;
            }
        }
    }, [yAxisTicksRef.current !== undefined, yAxisPadding, lineData]);

    useEffect(() => {
        if (yAxisPadding === undefined) return;

        const dpr = window.devicePixelRatio || 1;

        setCanvasInitialHeight(() => Math.max(chartHeight - 50, 100) * dpr);
        setCanvasInitialWidth(() => (chartWidth - yAxisPadding) * dpr);
    }, [yAxisPadding]);

    useEffect(() => {
        if (scaleDataRef.current) {
            const dpr = window.devicePixelRatio || 1;

            scaleDataRef.current.yScale &&
                scaleDataRef.current.yScale.range([
                    Math.max(chartHeight - 50, 100) * dpr,
                    0,
                ]);
            scaleDataRef.current.xScale &&
                scaleDataRef.current.xScale.range([
                    0,
                    (chartWidth - yAxisPadding) * dpr,
                ]);

            scaleDataRef.current.svgYScale &&
                scaleDataRef.current.svgYScale.range([
                    Math.max(chartHeight - 50, 100),
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
        const svgXAxis = d3.select('#xAxis');
        const svgYAxis = d3.select('#yAxis');

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
                        .axisRight(scaleDataRef.current.svgYScale)
                        .tickValues(yAxisTicksRef.current),
                )
                .select('.domain')
                .remove();

            svgYAxis.selectAll('line').remove();

            svgYAxis
                .select('g')
                .selectAll('text')
                .attr('fill', fillStyle)
                .attr('x', yAxisPadding - 5)
                .attr('shape-rendering', 'crispEdges')
                .style('font-family', font)
                .style('text-anchor', 'end')
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

            const dpr = window.devicePixelRatio || 1;

            context.clearRect(0, 0, width * dpr, (height - 50) * dpr);

            const lineSeries = d3
                .line<{ time: number; value: number }>()
                .x((d) => xScale(new Date(d.time)))
                .y((d) => yScale(d.value))
                .curve(curve === 'step' ? d3.curveStep : d3.curveBasis)
                .context(context);

            context.beginPath();
            lineSeries(lineData);
            context.lineWidth = 2 * dpr;
            context.strokeStyle = '#7371fc';
            context.stroke();

            yAxisTicksRef.current?.forEach((tick) => {
                context.moveTo(xScale(xScale.domain()[0]), yScale(tick));
                context.lineTo(xScale(xScale.domain()[1]), yScale(tick));
            });
            context.strokeStyle = 'rgba(189,189,189,0.15)';
            context.lineWidth = 2 * dpr;
            context.stroke();
        }
    }, [lineData, canvasInitialHeight, canvasInitialWidth]);

    return (
        <>
            {yAxisPadding !== undefined &&
                canvasInitialWidth !== undefined &&
                canvasInitialHeight !== undefined && (
                    <div className={styles.chartWrapper}>
                        <div
                            className={styles.chartContainer}
                            style={{
                                gridTemplateColumns:
                                    yAxisPadding +
                                    'px ' +
                                    (chartWidth - yAxisPadding + 'px'),
                            }}
                        >
                            <svg
                                id='yAxis'
                                style={{
                                    minHeight: '100px',
                                    width: yAxisPadding + 'px',
                                    height:
                                        Math.max(chartHeight - 50, 100) + 'px',
                                }}
                                height={Math.max(chartHeight - 50, 100)}
                                width={yAxisPadding}
                            />

                            <canvas
                                ref={canvasRef}
                                style={{
                                    minWidth: '100px',
                                    minHeight: '100px',
                                    height:
                                        Math.max(
                                            100,
                                            chartHeight - 50,
                                        ).toString() + 'px',
                                    width: chartWidth - yAxisPadding + 'px',
                                    maxHeight:
                                        Math.max(chartHeight - 50, 100) + 'px',
                                    maxWidth: chartWidth - yAxisPadding + 'px',
                                }}
                                width={canvasInitialWidth}
                                height={Math.max(100, canvasInitialHeight)}
                            />
                        </div>
                        <div className={styles.xAxisContainer}>
                            <svg
                                id='xAxis'
                                height='50'
                                width={chartWidth}
                                style={{ paddingLeft: yAxisPadding }}
                            />
                        </div>
                    </div>
                )}
        </>
    );
};

export default LineChart;
