import * as d3 from 'd3';
import React, { useEffect } from 'react';
import Button from '~/components/Button/Button';
import styles from './CollateralPieChart.module.css';

type PieData = { label: string; value: number };

type PieChartProps = {
    height?: number;
    width?: number;
};

const CollateralPieChart: React.FC<PieChartProps> = (props) => {
    const { height, width } = props;

    const chartHeight = height || 150;

    const pieData: PieData[] = [{ label: 'FUSD', value: 100 }];

    const dataColorSet = [
        '#7371fc',
        '#2775CA',
        '#FF9900',
        '#10D094',
        '#F83E03',
    ];

    const color = d3
        .scaleOrdinal<string>()
        .domain(pieData.map((d) => d.label))
        .range(dataColorSet);

    useEffect(() => {
        const canvas = document.getElementById(
            'pie-canvas',
        ) as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');

        if (!ctx) return;

        const width = canvas?.width;
        const height = canvas?.height;
        const radius = Math.min(width, height) / 2;

        const pie = d3.pie<PieData>().value((d: any) => d.value);
        const arcs = pie(pieData);

        function drawArc(
            ctx: CanvasRenderingContext2D,
            arc: d3.PieArcDatum<PieData>,
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
        }

        arcs.forEach((arc: any) => {
            drawArc(ctx, arc, color(arc.data.label));
        });
    }, [pieData]);

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
                        id='pie-canvas'
                        width={Math.max(Math.min(chartHeight, 250), 100)}
                        height={Math.max(Math.min(chartHeight, 250), 100)}
                    ></canvas>
                </div>
                {legend}
            </div>
        </div>
    );
};

export default CollateralPieChart;
