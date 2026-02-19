import React, { useEffect, useRef, useState } from 'react';
import LineChart from '~/components/LineChart/LineChart';

const StrategyDetailChart: React.FC = () => {
    const lineData = [
        { time: 1743446400000, value: 101.2 },
        { time: 1743532800000, value: 102.5 },
        { time: 1743619200000, value: 100.8 },
        { time: 1743705600000, value: 99.4 },
        { time: 1743792000000, value: 101.9 },
        { time: 1743878400000, value: 103.3 },
        { time: 1743964800000, value: 104.0 },
        { time: 1744051200000, value: 102.1 },
        { time: 1744137600000, value: 100.7 },
        { time: 1744224000000, value: 99.5 },
        { time: 1744310400000, value: 98.9 },
        { time: 1744396800000, value: 97.6 },
        { time: 1744483200000, value: 99.2 },
        { time: 1744569600000, value: 100.3 },
        { time: 1744656000000, value: 101.0 },
        { time: 1744742400000, value: 102.6 },
        { time: 1744828800000, value: 104.3 },
        { time: 1744915200000, value: 105.1 },
        { time: 1745001600000, value: 103.7 },
        { time: 1745088000000, value: 102.4 },
    ];

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chartSize, setChartSize] = useState<{
        width: number;
        height: number;
    }>({
        width: 370,
        height: 230,
    });

    useEffect(() => {
        const chartContainer = chartContainerRef.current;
        if (!chartContainer) return;

        const updateChartSize = (): void => {
            const nextWidth = Math.max(
                260,
                Math.floor(chartContainer.clientWidth - 8),
            );
            const nextHeight = Math.max(
                180,
                Math.min(260, Math.floor(nextWidth * 0.6)),
            );

            setChartSize((prev) => {
                if (prev.width === nextWidth && prev.height === nextHeight) {
                    return prev;
                }
                return {
                    width: nextWidth,
                    height: nextHeight,
                };
            });
        };

        updateChartSize();

        const resizeObserver = new ResizeObserver(updateChartSize);
        resizeObserver.observe(chartContainer);

        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div ref={chartContainerRef} style={{ width: '100%', minHeight: 190 }}>
            <LineChart
                lineData={lineData}
                curve={'step'}
                chartName={'strategy'}
                width={chartSize.width}
                height={chartSize.height}
            />
        </div>
    );
};

export default StrategyDetailChart;
