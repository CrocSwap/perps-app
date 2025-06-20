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

    const [yAxisTicks, setYAxisTicks] = React.useState<Array<number>>();
    const [yAxisPadding, setYAxisPadding] = React.useState<number>(50);

    const { numFormat } = useAppSettings();

    // Find Y axis ticks
    useEffect(() => {
        if (lineData) {
            const minPrice = d3.min(lineData, (d) => d.value);
            const maxPrice = d3.max(lineData, (d) => d.value);

            if (minPrice !== undefined && maxPrice !== undefined) {
                const tickCount = chartHeight - 50 > 150 ? 5 : 2;

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
    }, [lineData, chartName]);

    // Calculate Y axis width based on ticks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        if (yAxisTicks) {
            let textMeasure = 30;

            yAxisTicks?.forEach((tick) => {
                textMeasure = Math.max(
                    textMeasure,
                    context.measureText(d3.format(',')(tick)).width,
                );
            });

            const paddingFactor = textMeasure > 40 ? 1.5 : 2;

            setYAxisPadding(() => textMeasure + textMeasure / paddingFactor);
        }
    }, [yAxisTicks]);

    useEffect(() => {
        if (lineData === undefined) return;
        if (yAxisTicks === undefined || yAxisPadding === undefined) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const minDate = d3.min(lineData, (d) => d.time);
        const maxDate = d3.max(lineData, (d) => d.time);

        // Scales
        if (minDate && maxDate && lineData) {
            const diff = maxDate - minDate;

            const padding = diff / 40;

            const xScale = d3
                .scaleTime()
                .domain([new Date(minDate), new Date(maxDate + padding)])
                .range([0, chartWidth - yAxisPadding]);

            setXScale(() => xScale);
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
                    .domain([bottomBoundaryCanFit, topBoundaryCanFit])
                    .range([chartHeight - 50, 0]);

                setYScale(() => yScale);
            }
        }
    }, [yAxisTicks, yAxisPadding, chartName]);

    useEffect(() => {
        if (yAxisPadding === undefined) return;
        setCanvasInitialHeight(() => chartHeight - 50);
        setCanvasInitialWidth(() => chartWidth - yAxisPadding);
    }, [yAxisPadding]);

    useEffect(() => {
        yScale && yScale.range([chartHeight - 50, 0]);
        xScale && xScale.range([0, chartWidth - yAxisPadding]);
    }, [chartHeight, chartWidth, yScale, xScale]);

    useEffect(() => {
        const svgXAxis = d3.select('#xAxis');
        const svgYAxis = d3.select('#yAxis');

        const fillStyle = 'var(--text1)';
        const font = 'var(--font-family-main)';
        const fontSize = 'var(--font-size-s)';

        if (xScale) {
            svgXAxis.select('g').remove();

            const tickScale = xScale.copy();

            const diff =
                xScale.domain()[1].getTime() - xScale.domain()[0].getTime();

            const padding = diff / 40;

            tickScale.domain([
                new Date(xScale.domain()[0].getTime() + padding),
                new Date(xScale.domain()[1].getTime() - padding),
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

        if (yScale && yAxisTicks && yAxisPadding) {
            svgYAxis.select('g').remove();

            svgYAxis
                .append('g')
                .attr('id', 'yAxisGroup')
                .call(d3.axisRight(yScale).tickValues(yAxisTicks))
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
    }, [yScale, xScale, numFormat, yAxisTicks, yAxisPadding]);

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

            context.clearRect(0, 0, width, height - 50);

            const line = d3
                .line<{ time: number; value: number }>()
                .x((d) => xScale(new Date(d.time)))
                .y((d) => yScale(d.value))
                .curve(curve === 'step' ? d3.curveStep : d3.curveBasis)
                .context(context);

            context.beginPath();
            line(lineData);
            context.lineWidth = 2;
            context.strokeStyle = '#7371fc';
            context.stroke();

            yAxisTicks?.forEach((tick) => {
                context.moveTo(xScale(xScale.domain()[0]), yScale(tick));
                context.lineTo(xScale(xScale.domain()[1]), yScale(tick));
            });
            context.strokeStyle = 'rgba(189,189,189,0.15)';
            context.lineWidth = 2;
            context.stroke();
        }
    }, [
        yScale !== undefined,
        xScale !== undefined,
        lineData,
        chartName,
        yAxisTicks,
        canvasInitialHeight,
        canvasInitialWidth,
    ]);

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
                                height={chartHeight - 50}
                                width={yAxisPadding}
                            />

                            <canvas
                                ref={canvasRef}
                                style={{
                                    minWidth: '100px',
                                    minHeight: '100px',
                                    height: chartHeight - 50 + 'px',
                                    width: chartWidth - yAxisPadding + 'px',
                                    maxHeight: chartHeight - 50 + 'px',
                                    maxWidth: chartWidth - yAxisPadding + 'px',
                                }}
                                width={canvasInitialWidth}
                                height={canvasInitialHeight}
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
