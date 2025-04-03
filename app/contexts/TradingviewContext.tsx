import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWsObserver } from '~/hooks/useWsObserver';
import { createDataFeed } from '~/routes/chart/data/customDataFeed';
import {
    drawingEvent,
    drawingEventUnsubscribe,
    intervalChangedSubscribe,
    intervalChangedUnsubscribe,
    studyEvents,
    studyEventsUnsubscribe,
} from '~/routes/chart/data/utils/chartEvents';
import {
    getChartLayout,
    saveChartLayout,
} from '~/routes/chart/data/utils/chartStorage';
import {
    priceFormatterFactory,
    type ChartLayout,
} from '~/routes/chart/data/utils/utils';
import {
    widget,
    type IChartingLibraryWidget,
    type ResolutionString,
    type TradingTerminalFeatureset,
} from '~/tv/charting_library';

interface TradingViewContextType {
    chart: IChartingLibraryWidget | null;
}

const TradingViewContext = createContext<TradingViewContextType>({
    chart: null,
});

export interface ChartContainerProps {
    symbolName: string;
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
    // const { symbol } = useTradeDataStore();
    const symbol = 'BTC';

    const [chartState, setChartState] = useState<ChartLayout | null>();

    useEffect(() => {
        const res = getChartLayout();
        setChartState(res);
    }, []);

    const defaultProps: Omit<ChartContainerProps, 'container'> = {
        symbolName: 'BTC',
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
            interval: (chartState?.interval || '1D') as ResolutionString,
            disabled_features: [
                'volume_force_overlay',
                'header_symbol_search',
                'header_compare',
                ...(chartState
                    ? [
                          'create_volume_indicator_by_default' as TradingTerminalFeatureset,
                      ]
                    : []),
            ],
            favorites: {
                intervals: ['5', '1h', 'D'] as ResolutionString[],
            },
            locale: 'en',
            theme: 'dark',
            overrides: {
                volumePaneSize: 'medium',
            },
            custom_css_url: './../tradingview-overrides.css',
            loading_screen: { backgroundColor: '#0e0e14' },
            // load_last_chart:false,
            time_frames: [
                { text: '5y', resolution: '1w' as ResolutionString },
                { text: '1y', resolution: '1w' as ResolutionString },
                { text: '6m', resolution: '120' as ResolutionString },
                { text: '3m', resolution: '60' as ResolutionString },
                { text: '1m', resolution: '30' as ResolutionString },
                { text: '5d', resolution: '5' as ResolutionString },
                { text: '1d', resolution: '1' as ResolutionString },
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

            chartState && tvWidget.load(chartState.chartLayout);

            /**
             * 0 -> main chart pane
             * 1 -> volume chart pane
             */
            const volumePaneIndex = 1;

            const paneCount = tvWidget.activeChart().getPanes().length;

            if (paneCount > volumePaneIndex) {
                const priceScale = tvWidget
                    .activeChart()
                    .getPanes()
                    [volumePaneIndex].getMainSourcePriceScale();

                if (priceScale) {
                    priceScale.setAutoScale(true);
                    priceScale.setMode(0);
                }
            }
            setChart(tvWidget);
        });

        return () => {
            if (chart) {
                drawingEventUnsubscribe(chart);
                studyEventsUnsubscribe(chart);
                intervalChangedUnsubscribe(chart);
                chart.remove();
            }
        };
    }, [chartState]);

    useEffect(() => {
        if (chart) {
            const chartRef = chart.chart();
            chartRef.setSymbol(symbol);
            saveChartLayout(chart);
        }
    }, [symbol]);

    useEffect(() => {
        if (!chart) return;
        drawingEvent(chart);
        studyEvents(chart);
        intervalChangedSubscribe(chart);
    }, [chart]);

    return (
        <TradingViewContext.Provider value={{ chart }}>
            {children}
        </TradingViewContext.Provider>
    );
};

export const useTradingView = () => useContext(TradingViewContext);
