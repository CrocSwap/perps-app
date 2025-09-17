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

    const [xScale, setXScale] = React.useState<d3.ScaleTime<number, number>>();
    const [yScale, setYScale] =
        React.useState<d3.ScaleLinear<number, number>>();

    const [svgXScale, setSvgXScale] =
        React.useState<d3.ScaleTime<number, number>>();
    const [svgYScale, setSvgYScale] =
        React.useState<d3.ScaleLinear<number, number>>();

    const [yAxisTicks, setYAxisTicks] = React.useState<Array<number>>();
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

                setYAxisTicks(() => ticks);
            }
        }
    }, [lineData, chartName, chartHeight]);

    // Calculate Y axis width based on ticks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        if (yAxisTicks) {
            const textMeasure: Array<number> = [];

            yAxisTicks?.forEach((tick) => {
                textMeasure.push(
                    context.measureText(d3.format(',')(tick)).width,
                );
            });

            const maxTextWidth = d3.max(textMeasure);

            maxTextWidth &&
                setYAxisPadding(() => maxTextWidth + maxTextWidth / 1.5);
        }
    }, [yAxisTicks]);

    useEffect(() => {
        if (lineData === undefined) return;
        if (yAxisTicks === undefined || yAxisPadding === undefined) return;

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

            setXScale(() => xScale);
            setSvgXScale(() => svgXScale);
        }

        const minPrice = d3.min(lineData, (d) => d.value);
        const maxPrice = d3.max(lineData, (d) => d.value);

        if (minPrice !== undefined && maxPrice !== undefined) {
            const diff = maxPrice - minPrice;

            const padding = diff / 15;

            const roundedMax = d3.max(yAxisTicks);
            const roundedMin = d3.min(yAxisTicks);

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

                svgYScale.range([0, Math.max(chartHeight - 50, 100)]);
                yScale.range([(chartHeight - 50) * dpr, 0]);

                setYScale(() => yScale);
                setSvgYScale(() => svgYScale);
            }
        }
    }, [yAxisTicks !== undefined, yAxisPadding, lineData]);

    useEffect(() => {
        if (yAxisPadding === undefined) return;

        const dpr = window.devicePixelRatio || 1;

        setCanvasInitialHeight(() => Math.max(chartHeight - 50, 100) * dpr);
        setCanvasInitialWidth(() => (chartWidth - yAxisPadding) * dpr);
    }, [yAxisPadding]);

    useEffect(() => {
        const dpr = window.devicePixelRatio || 1;

        yScale && yScale.range([Math.max(chartHeight - 50, 100) * dpr, 0]);
        xScale && xScale.range([0, (chartWidth - yAxisPadding) * dpr]);

        svgYScale && svgYScale.range([Math.max(chartHeight - 50, 100), 0]);
        svgXScale && svgXScale.range([0, chartWidth - yAxisPadding]);
    }, [chartHeight, chartWidth, yScale, xScale]);

    useEffect(() => {
        const svgXAxis = d3.select('#xAxis');
        const svgYAxis = d3.select('#yAxis');

        const fillStyle = 'var(--text1, #f0f0f8)';
        const font = 'var(--font-family-main)';
        const fontSize = 'var(--font-size-s)';

        if (svgXScale) {
            svgXAxis.select('g').remove();

            const tickScale = svgXScale.copy();

            const diff =
                svgXScale.domain()[1].getTime() -
                svgXScale.domain()[0].getTime();

            const padding = diff / 40;

            tickScale.domain([
                new Date(svgXScale.domain()[0].getTime() + padding),
                new Date(svgXScale.domain()[1].getTime() - padding),
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

        if (svgYScale && yAxisTicks && yAxisPadding) {
            svgYAxis.select('g').remove();

            svgYAxis
                .append('g')
                .attr('id', 'yAxisGroup')
                .call(d3.axisRight(svgYScale).tickValues(yAxisTicks))
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
        svgXScale,
        svgYScale,
        numFormat,
        yAxisTicks,
        yAxisPadding,
        chartHeight,
        chartWidth,
    ]);

    useEffect(() => {
        if (
            yScale &&
            xScale &&
            lineData &&
            canvasInitialHeight &&
            canvasInitialWidth
        ) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            const width = chartWidth || canvas.getBoundingClientRect()?.width;
            const height =
                chartHeight || canvas.getBoundingClientRect()?.height;

            const dpr = window.devicePixelRatio || 1;

            context.clearRect(0, 0, width * dpr, (height - 50) * dpr);

            const line = d3
                .line<{ time: number; value: number }>()
                .x((d) => xScale(new Date(d.time)))
                .y((d) => yScale(d.value))
                .curve(curve === 'step' ? d3.curveStep : d3.curveBasis)
                .context(context);

            context.beginPath();
            line(lineData);
            context.lineWidth = 2 * dpr;
            context.strokeStyle = '#7371fc';
            context.stroke();

            yAxisTicks?.forEach((tick) => {
                context.moveTo(xScale(xScale.domain()[0]), yScale(tick));
                context.lineTo(xScale(xScale.domain()[1]), yScale(tick));
            });
            context.strokeStyle = 'rgba(189,189,189,0.15)';
            context.lineWidth = 2 * dpr;
            context.stroke();
        }
    }, [yScale, xScale, canvasInitialHeight, canvasInitialWidth]);

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
