import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import React, { useEffect, useMemo, useRef } from 'react';
import styles from './CollateralPieChart.module.css';
import useMediaQuery from '~/hooks/useMediaQuery';

type PieData = { label: string; value: number; balance: number };

type PieChartProps = {
    height?: number;
    width?: number;
};

const CollateralPieChart: React.FC<PieChartProps> = (props) => {
    const { t } = useTranslation();
    const { height, width } = props;
    const isMobile = useMediaQuery('(max-width: 768px)');

    const chartHeight = height || 150;
    const chartWidth = width || chartHeight;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const minCanvasSizeBase = isMobile ? 160 : 180;
    const maxCanvasSizeBase = isMobile ? 240 : 320;
    const availableHeight = Math.max(chartHeight - (isMobile ? 24 : 32), 120);
    const availableWidth = Math.max(chartWidth - (isMobile ? 24 : 48), 120);
    const maxCanvasSize = Math.min(
        maxCanvasSizeBase,
        availableHeight,
        availableWidth,
    );
    const minCanvasSize = Math.min(minCanvasSizeBase, maxCanvasSize);
    const baseCanvasSize = Math.min(
        availableHeight * (isMobile ? 0.9 : 0.85),
        availableWidth * (isMobile ? 0.75 : 0.65),
    );
    const canvasSize = Math.max(
        Math.min(baseCanvasSize, maxCanvasSize),
        minCanvasSize,
    );
    const canvasHeight = canvasSize;
    const canvasWidth = canvasSize;

    const pieData: PieData[] = useMemo(
        () => [
            { label: t('portfolio.fusd'), value: 50, balance: 5000 },
            { label: t('Btc'), value: 30, balance: 3000 },
            { label: t('Eth'), value: 20, balance: 2000 },
        ],
        [t],
    );

    const dataColorSet = [
        '#7371fc',
        '#2775CA',
        '#FF9900',
        '#10D094',
        '#F83E03',
    ];

    const color = d3
        .scaleOrdinal()
        .domain(pieData.map((d) => d.label))
        .range(dataColorSet);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        const radius = Math.min(width, height) / 2;

        const pie = d3.pie().value((d: any) => d.value);
        const arcs = pie(pieData);

        function drawArc(
            ctx: CanvasRenderingContext2D,
            arc: any,
            color: string,
        ) {
            const startAngle = arc.startAngle;
            const endAngle = arc.endAngle;

            ctx.beginPath();
            ctx.moveTo(width / 2, height / 2);
            ctx.arc(width / 2, height / 2, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            const midAngle = Number((startAngle + endAngle) / 2).toFixed(4);

            const textRadius = radius * 0.6;
            const textX = width / 2 + textRadius * Math.cos(Number(midAngle));
            const textY = height / 2 + textRadius * Math.sin(Number(midAngle));

            ctx.fillStyle = '#f0f0f8';
            ctx.font = '14px Lexend Deca';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(arc.data.label, textX, textY - 7);
            ctx.fillText(arc.data.balance.toString(), textX, textY + 7);
        }

        arcs.forEach((arc: any) => {
            drawArc(ctx, arc, color(arc.data.label));
        });
    }, [pieData, canvasHeight, canvasWidth]);

    const legend = (
        <div className={styles.legendContainer}>
            {pieData.map((d, i) => (
                <div key={i} className={styles.legendItem}>
                    <div className={styles.legendLabel}>
                        <div
                            className={styles.legendColor}
                            style={{ backgroundColor: dataColorSet[i] }}
                        ></div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <span style={{ color: color(d.label) }}>
                                {d.label}
                            </span>
                            <span style={{ color: color(d.label) }}>
                                {d.value + '%'}
                            </span>
                        </div>
                    </div>
                    {/* <div>
                        <Button size='medium'>Convert</Button>
                    </div> */}
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.collateralChartContainer}>
            <div className={styles.dataContainer}>
                <div className={styles.dataLabel}>
                    <canvas
                        ref={canvasRef}
                        width={canvasWidth}
                        height={canvasHeight}
                    ></canvas>
                </div>
                {legend}
            </div>
        </div>
    );
};

export default CollateralPieChart;
