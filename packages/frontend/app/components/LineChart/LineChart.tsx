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

    const [canvasInitialWidth] = React.useState<number>(chartWidth);
    const [canvasInitialHeight] = React.useState<number>(chartHeight);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [xScale, setXScale] = React.useState<d3.ScaleTime<number, number>>();
    const [yScale, setYScale] =
        React.useState<d3.ScaleLinear<number, number>>();

    const [yAxisTicks, setYAxisTicks] = React.useState<Array<number>>();
    const [yAxisPadding, setYAxisPadding] = React.useState<number>(50);

    const { numFormat } = useAppSettings();

    useEffect(() => {
        if (lineData === undefined) return;

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
                .range([0, chartWidth]);

            setXScale(() => xScale);
        }

        const minPrice = d3.min(lineData, (d) => d.value);
        const maxPrice = d3.max(lineData, (d) => d.value);

        if (minPrice !== undefined && maxPrice !== undefined) {
            const diff = maxPrice - minPrice;

            const padding = diff / 15;

            const tickCount = chartHeight > 150 ? 5 : 2;

            const ticks = d3.ticks(
                minPrice - padding,
                maxPrice + padding,
                tickCount,
            );

            setYAxisTicks(() => ticks);

            const roundedMax = d3.max(ticks);
            const roundedMin = d3.min(ticks);

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
                    .range([chartHeight, 0]);

                setYScale(() => yScale);
            }
        }
    }, [lineData, chartName]);

    useEffect(() => {
        yScale && yScale.range([chartHeight, 0]);
        xScale && xScale.range([0, chartWidth]);
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

        if (yScale && yAxisTicks) {
            svgYAxis.select('g').remove();

            svgYAxis
                .append('g')
                .call(d3.axisRight(yScale).tickValues(yAxisTicks))
                .select('.domain')
                .remove();

            svgYAxis.selectAll('line').remove();

            svgYAxis
                .select('g')
                .selectAll('text')
                .attr('fill', fillStyle)
                .attr('shape-rendering', 'crispEdges')
                .style('font-family', font)
                .style('font-size', fontSize);
        }
    }, [
        yScale,
        xScale,
        numFormat,
        lineData,
        chartName,
        yAxisTicks,
        chartHeight,
        chartWidth,
    ]);

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
                    context.measureText(tick.toString()).width,
                );
            });

            setYAxisPadding(() => textMeasure + 15);
        }
    }, [yAxisTicks, chartName, lineData]);

    useEffect(() => {
        if (yScale && xScale && lineData) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d');
            if (!context) return;

            const width = chartWidth || canvas.getBoundingClientRect()?.width;
            const height =
                chartHeight || canvas.getBoundingClientRect()?.height;

            context.clearRect(0, 0, width, height);

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
    ]);

    return (
        <div className={styles.chartWrapper}>
            <div
                className={styles.chartContainer}
                style={{
                    gridTemplateColumns:
                        yAxisPadding + 'px ' + chartWidth + 'px',
                }}
            >
                <svg id='yAxis' height={chartHeight} />

                <canvas
                    ref={canvasRef}
                    style={{
                        minWidth: '100px',
                        minHeight: '100px',
                        height: chartHeight + 'px',
                        width: chartWidth + 'px',
                        maxHeight: chartHeight + 'px',
                        maxWidth: chartWidth + 'px',
                    }}
                    width={canvasInitialWidth}
                    height={canvasInitialHeight}
                />
            </div>
            <div className={styles.xAxisContainer}>
                <svg
                    id='xAxis'
                    height='50'
                    width={chartWidth + yAxisPadding}
                    style={{ paddingLeft: yAxisPadding }}
                />
            </div>
        </div>
    );
};

export default LineChart;
