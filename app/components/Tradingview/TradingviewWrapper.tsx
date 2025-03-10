import React from "react";
import { TradingViewProvider } from "~/contexts/TradingviewContext";
import TradingViewChart from "~/routes/chart/chart";


const TradingViewWrapper: React.FC = () => {

    
  return (
    <TradingViewProvider>
        <TradingViewChart/>
    </TradingViewProvider>
  );
};

export default TradingViewWrapper;
