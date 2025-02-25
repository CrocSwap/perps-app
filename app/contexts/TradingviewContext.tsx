import { widget, type IChartingLibraryWidget, type ResolutionString } from "public/tradingview/charting_library";
import React, { createContext, useContext, useState, useEffect } from "react";
import { createDataFeed } from "~/routes/chart/data/customDataFeed";
import { useWebSocketContext } from "./WebSocketContext";
import { useWsObserver } from "~/hooks/useWsObserver";

interface TradingViewContextType {
  chart: IChartingLibraryWidget | null;
}

const TradingViewContext = createContext<TradingViewContextType>({ chart: null });

export interface ChartContainerProps {
    symbolName: string;
    interval: ResolutionString;
    libraryPath: string;
    chartsStorageUrl: string;
    chartsStorageApiVersion: string;
    clientId: string;
    userId: string;
    fullscreen: boolean;
    autosize: boolean;
    studiesOverrides: any;
    container: string;
  }

export const TradingViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chart, setChart] = useState<IChartingLibraryWidget | null>(null);

     const { subscribe} = useWsObserver();

  const defaultProps: Omit<ChartContainerProps, "container"> = {
    symbolName: "BTC",
    interval: "D" as ResolutionString,
    libraryPath: "/tradingview/charting_library/",
    chartsStorageUrl: "https://saveload.tradingview.com",
    chartsStorageApiVersion: "1.1",
    clientId: "tradingview.com",
    userId: "public_user_id",
    fullscreen: false,
    autosize: true,
    studiesOverrides: {},
  };

      const changeSubscription = (payload: any) => {
        subscribe('candle', 
          {payload: payload,
          handler: (payload) => {console.log('subs', payload)},
          single: true
        })
      }
  
      useEffect(() => {
        changeSubscription({
          coin: defaultProps.symbolName,
          interval: defaultProps.interval,
        });
      }, [defaultProps.symbolName])

  useEffect(() => {
    const tvWidget = new widget({
      container: "tv_chart",
      library_path: defaultProps.libraryPath,
      timezone: "Etc/UTC",
      symbol: defaultProps.symbolName,
      fullscreen: false,
      autosize: true,
      datafeed: createDataFeed() as any,
      interval: defaultProps.interval,
      locale: "en",
      theme: "dark",
      // overrides: {
      //   "paneProperties.background": "#0e0e14",
      //   "paneProperties.backgroundType": "solid",
      // },
      // custom_css_url: "./../tradingview-chart-custom.css",
      loading_screen: { backgroundColor: "#0e0e14" },
      // load_last_chart:false,
      time_frames: [
        { text: "1m", resolution: "1" as ResolutionString},   
        { text: "5m", resolution: "5" as ResolutionString},   
        { text: "15m", resolution: "15" as ResolutionString}, 
        { text: "1H", resolution: "60" as ResolutionString},  
        { text: "4H", resolution: "240" as ResolutionString}, 
        { text: "1D", resolution: "1D" as ResolutionString },  

    ],
    });    

    setChart(tvWidget);

    return () => tvWidget.remove();
  }, []);

  return <TradingViewContext.Provider value={{ chart }}>{children}</TradingViewContext.Provider>;
};

export const useTradingView = () => useContext(TradingViewContext);
