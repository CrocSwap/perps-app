import { useEffect, useState } from 'react';
import { useMobile } from '~/hooks/useMediaQuery';
import { useAppStateStore } from '~/stores/AppStateStore';

const TradingViewChart = () => {
    const isMobile = useMobile(768);

    const [chartHeight, setChartHeight] = useState(400);
    const { debugToolbarOpen } = useAppStateStore();

    const assignChartHeight = () => {
        const chartSection = document.getElementById('chartSection');
        if (chartSection) {
            setChartHeight(chartSection.clientHeight);
        }
    };

    useEffect(() => {
        assignChartHeight();
    }, []);

    useEffect(() => {
        window.addEventListener('resize', assignChartHeight);
        return () => {
            window.removeEventListener('resize', assignChartHeight);
        };
    }, []);

    useEffect(() => {
        assignChartHeight();
    }, [debugToolbarOpen]);

    return (
        <div
            id='tv_chart'
            style={{ position: 'relative', width: '100%', height: '100%' }}
        />
    );
};

export default TradingViewChart;
