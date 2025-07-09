import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useSdk } from '~/hooks/useSdk';
import { getMarkFillData } from '~/routes/chart/data/candleDataCache';
import { createDataFeed } from '~/routes/chart/data/customDataFeed';
import {
    drawingEvent,
    drawingEventUnsubscribe,
    intervalChangedSubscribe,
    intervalChangedUnsubscribe,
    studyEvents,
    studyEventsUnsubscribe,
    visibleRangeChangedSubscribe,
    visibleRangeChangedUnsubscribe,
} from '~/routes/chart/data/utils/chartEvents';
import {
    getChartLayout,
    saveChartLayout,
} from '~/routes/chart/data/utils/chartStorage';
import {
    checkDefaultColors,
    customThemes,
    defaultDrawingToolColors,
    getChartDefaultColors,
    getChartThemeColors,
    priceFormatterFactory,
    type ChartLayout,
} from '~/routes/chart/data/utils/utils';
import { useAppOptions } from '~/stores/AppOptionsStore';
import { useAppSettings, type colorSetIF } from '~/stores/AppSettingsStore';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    widget,
    type IBasicDataFeed,
    type IChartingLibraryWidget,
    type ResolutionString,
    type TradingTerminalFeatureset,
} from '~/tv/charting_library';

interface TradingViewContextType {
    chart: IChartingLibraryWidget | null;
    isChartReady: boolean;
}

export const TradingViewContext = createContext<TradingViewContextType>({
    chart: null,
    isChartReady: false,
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

    const { info } = useSdk();

    const { symbol } = useTradeDataStore();

    const [chartState, setChartState] = useState<ChartLayout | null>();

    const { debugWallet } = useDebugStore();

    const { showBuysSellsOnChart } = useAppOptions();

    const [isChartReady, setIsChartReady] = useState(false);
    const { marketId } = useParams<{ marketId: string }>();
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

    // logic to change the active color pair
    const { bsColor, getBsColor } = useAppSettings();

    function changeColors(c: colorSetIF): void {
        // make sure the chart exists
        if (chart) {
            chart.applyOverrides({
                'mainSeriesProperties.candleStyle.upColor': c.buy,
                'mainSeriesProperties.candleStyle.downColor': c.sell,
                'mainSeriesProperties.candleStyle.borderUpColor': c.buy,
                'mainSeriesProperties.candleStyle.borderDownColor': c.sell,
                'mainSeriesProperties.candleStyle.wickUpColor': c.buy,
                'mainSeriesProperties.candleStyle.wickDownColor': c.sell,
            });

            if (chart) {
                const volumeStudyId = chart
                    .activeChart()
                    .getAllStudies()
                    .find((x) => x.name === 'Volume');

                if (volumeStudyId) {
                    const volume = chart
                        .activeChart()
                        .getStudyById(volumeStudyId.id);
                    volume.applyOverrides({
                        'volume.color.0': c.buy,
                        'volume.color.1': c.sell,
                    });
                }
            }
        }
    }

    useEffect(() => {
        if (chart) {
            showBuysSellsOnChart && chart.chart().refreshMarks();
        }
    }, [bsColor, chart, showBuysSellsOnChart]);

    useEffect(() => {
        if (!isChartReady && chart) {
            const intervalId = setInterval(() => {
                const isReady = chart.chart().dataReady();
                setIsChartReady(isReady);
            }, 200);
            return () => clearInterval(intervalId);
        }
    }, [chart, isChartReady]);

    useEffect(() => {
        if (chart) {
            chart.subscribe('series_properties_changed', () => {
                const activeColors = getChartDefaultColors();
                const chartThemeColors = getChartThemeColors();

                const isInitial =
                    chartThemeColors &&
                    activeColors &&
                    activeColors[0] === chartThemeColors.buy &&
                    activeColors[1] === chartThemeColors.sell;

                const isCustomized = checkDefaultColors();

                if (chartThemeColors && !isInitial && !isCustomized) {
                    changeColors(getBsColor());
                }

                saveChartLayout(chart);
                showBuysSellsOnChart && chart.chart().refreshMarks();
            });
        }
    }, [chart]);

    // side effect to load a custom color set into the table, runs when
    // ... the user changes the app's color theme and when the chart
    // ... finishes initialization
    useEffect(() => {
        const isCustomized = checkDefaultColors();
        if (!isCustomized) changeColors(getBsColor());
    }, [bsColor, chart]);

    useEffect(() => {
        if (!info) return;

        const tvWidget = new widget({
            container: 'tv_chart',
            library_path: defaultProps.libraryPath,
            timezone: 'Etc/UTC',
            symbol: marketId,
            fullscreen: false,
            autosize: true,
            datafeed: createDataFeed(info) as IBasicDataFeed,
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
            custom_themes: customThemes(),
            overrides: {
                volumePaneSize: 'medium',
                'paneProperties.background': '#0e0e14',
                'paneProperties.backgroundGradientStartColor': '#0e0e14',
                'paneProperties.backgroundGradientEndColor': '#0e0e14',
            },
            custom_css_url: './../tradingview-overrides.css',
            loading_screen: { backgroundColor: '#0e0e14' },
            saved_data: chartState ? chartState.chartLayout : undefined,
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
                    // eslint-disable-next-line no-unexpected-multiline
                    [volumePaneIndex].getMainSourcePriceScale();

                if (priceScale) {
                    priceScale.setAutoScale(true);
                    priceScale.setMode(0);
                }
            }

            tvWidget.applyOverrides(defaultDrawingToolColors());

            setChart(tvWidget);
        });

        return () => {
            if (chart) {
                drawingEventUnsubscribe(chart);
                studyEventsUnsubscribe(chart);
                intervalChangedUnsubscribe(chart);
                visibleRangeChangedUnsubscribe(chart);
                chart.remove();
            }
        };
    }, [chartState, info]);

    useEffect(() => {
        if (chart) {
            setIsChartReady(false);
            const chartRef = chart.chart();
            chartRef.setSymbol(symbol);
            saveChartLayout(chart);
        }
    }, [symbol]);

    useEffect(() => {
        setIsChartReady(false);
    }, [debugWallet]);

    useEffect(() => {
        if (!chart) return;
        drawingEvent(chart);
        studyEvents(chart);
        intervalChangedSubscribe(chart, setIsChartReady);
        visibleRangeChangedSubscribe(chart);
    }, [chart]);

    useEffect(() => {
        if (debugWallet.address) {
            getMarkFillData(symbol, debugWallet.address).then(() => {
                if (chart) {
                    chart.chart().clearMarks();
                    showBuysSellsOnChart && chart.chart().refreshMarks();
                }
            });
        }
    }, [debugWallet, chart, symbol]);

    useEffect(() => {
        if (chart) {
            showBuysSellsOnChart || chart.chart().clearMarks();
            showBuysSellsOnChart && chart.chart().refreshMarks();
        }
    }, [showBuysSellsOnChart]);

    return (
        <TradingViewContext.Provider value={{ chart, isChartReady }}>
            {children}
        </TradingViewContext.Provider>
    );
};

export const useTradingView = () => useContext(TradingViewContext);
