import {
    widget,
    type Bar,
    type IChartingLibraryWidget,
    type LibrarySymbolInfo,
  type ResolutionString,
} from '~/tv/charting_library';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createDataFeed } from '~/routes/chart/data/customDataFeed';
import { useWsObserver } from '~/hooks/useWsObserver';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { loadChartDrawState } from '~/routes/chart/data/utils/chartStorage';
import { useChartEvents } from '~/routes/chart/hook/useChartEvents';
import { priceFormatterFactory } from '~/routes/chart/data/utils/utils';

interface TradingViewContextType {
    chart: IChartingLibraryWidget | null;
}

const TradingViewContext = createContext<TradingViewContextType>({
    chart: null,
});

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

export const TradingViewProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [chart, setChart] = useState<IChartingLibraryWidget | null>(null);

    const { subscribe } = useWsObserver();
    const { symbol } = useTradeDataStore();
    
    useChartEvents(chart);

    const defaultProps: Omit<ChartContainerProps, 'container'> = {
        symbolName: 'BTC',
        interval: 'D' as ResolutionString,
        libraryPath: '/tv/charting_library/',
        chartsStorageUrl: 'https://saveload.tradingview.com',
        chartsStorageApiVersion: '1.1',
        clientId: 'tradingview.com',
        userId: 'public_user_id',
        fullscreen: false,
        autosize: true,
        studiesOverrides: {},
    };

    useEffect(() => {
        const tvWidget = new widget({
            container: 'tv_chart',
            library_path: defaultProps.libraryPath,
            timezone: 'Etc/UTC',
            symbol: symbol,
            fullscreen: false,
            autosize: true,
            datafeed: createDataFeed(subscribe) as any,
            interval: defaultProps.interval,
            disabled_features: [
                'volume_force_overlay' /* "use_localstorage_for_settings" */,
            ],
            locale: 'en',
            theme: 'dark',
            overrides: {
                volumePaneSize: 'medium',
            },
            custom_css_url: './../tradingview-overrides.css',
            loading_screen: { backgroundColor: '#0e0e14' },
            // load_last_chart:false,
            time_frames: [
                { text: '1m', resolution: '1' as ResolutionString },
                { text: '5m', resolution: '5' as ResolutionString },
                { text: '15m', resolution: '15' as ResolutionString },
                { text: '1H', resolution: '60' as ResolutionString },
                { text: '4H', resolution: '240' as ResolutionString },
                { text: '1D', resolution: '1D' as ResolutionString },
            ],
          custom_formatters: {
        priceFormatterFactory: priceFormatterFactory,
      },
    });

        tvWidget.onChartReady(() => {
            tvWidget.applyOverrides({
                'paneProperties.background': '#0e0e14',
                'paneProperties.backgroundType': 'solid',
            });

            /**
             * 0 -> main chart pane
             * 1 -> volume chart pane
             */
            const volumePaneIndex = 1;
            const priceScale = tvWidget
                .activeChart()
                .getPanes()
                [volumePaneIndex].getMainSourcePriceScale();

            if (priceScale) {
                priceScale.setAutoScale(true);
                priceScale.setMode(0);
            }
            setChart(tvWidget);

            loadChartDrawState(tvWidget);
        });

        return () => tvWidget.remove();
    }, []);

    useEffect(() => {
        if (chart) {
            const chartRef = chart.chart();
            chartRef.setSymbol(symbol);
        }
    }, [symbol]);

    return (
        <TradingViewContext.Provider value={{ chart }}>
            {children}
        </TradingViewContext.Provider>
    );
};

export const useTradingView = () => useContext(TradingViewContext);
