import React from 'react';
import { TradingViewProvider } from '~/contexts/TradingviewContext';
import TradingViewChart from '~/routes/chart/chart';
import OpenOrderLine from '~/routes/chart/orders/openOrderLine';
import PositionOrderLine from '~/routes/chart/orders/positionOrderLine';

const TradingViewWrapper: React.FC = () => {
    return (
        <TradingViewProvider>
            <TradingViewChart />
            <OpenOrderLine />
            <PositionOrderLine />
        </TradingViewProvider>
    );
};

export default TradingViewWrapper;
