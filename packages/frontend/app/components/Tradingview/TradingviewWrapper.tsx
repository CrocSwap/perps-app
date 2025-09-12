import React from 'react';
import { TradingViewProvider } from '~/contexts/TradingviewContext';
import TradingViewChart from '~/routes/chart/chart';
import LiquidationOverlayCanvas from '~/routes/chart/overlayCanvas/LiqudationOverlayCanvas';
import OrderLinesOverlayCanvas from '~/routes/chart/overlayCanvas/OrderLinesOverlayCanvas';
import { useAppStateStore } from '~/stores/AppStateStore';

const TradingViewWrapper: React.FC = () => {
    const { liquidationsActive } = useAppStateStore();

    return (
        <TradingViewProvider>
            <TradingViewChart />
            {liquidationsActive && <LiquidationOverlayCanvas />}
            <OrderLinesOverlayCanvas />
        </TradingViewProvider>
    );
};

export default TradingViewWrapper;
