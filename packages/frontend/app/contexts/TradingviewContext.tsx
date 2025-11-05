import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useParams } from 'react-router';
import { useSdk } from '~/hooks/useSdk';
import { getMarkFillData } from '~/routes/chart/data/candleDataCache';
import {
    createDataFeed,
    type CustomDataFeedType,
} from '~/routes/chart/data/customDataFeed';
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
    mapI18nToTvLocale,
    priceFormatterFactory,
    type ChartLayout,
} from '~/routes/chart/data/utils/utils';
import { useAppOptions } from '~/stores/AppOptionsStore';
import { useAppSettings, type colorSetIF } from '~/stores/AppSettingsStore';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import type {
    IBasicDataFeed,
    IChartingLibraryWidget,
    LanguageCode,
    ResolutionString,
    TradingTerminalFeatureset,
} from '~/tv/charting_library';
import { processSymbolUrlParam } from '~/utils/AppUtils';

import i18n from 'i18next';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studiesOverrides: any;
    container: string;
}

export const TradingViewProvider: React.FC<{
    children: React.ReactNode;
    tradingviewLib?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        widget?: new (opts: any) => IChartingLibraryWidget;
    } | null;
    setChartLoadingStatus: React.Dispatch<
        React.SetStateAction<'loading' | 'error' | 'ready'>
    >;
}> = ({ children, tradingviewLib, setChartLoadingStatus }) => {
    const [chart, setChart] = useState<IChartingLibraryWidget | null>(null);

    const { info, lastSleepMs, lastAwakeMs } = useSdk();

    const { symbol, addToFetchedChannels } = useTradeDataStore();

    const [chartState, setChartState] = useState<ChartLayout | null>();

    const { userAddress } = useUserDataStore();

    const { showBuysSellsOnChart } = useAppOptions();

    const [chartInterval, setChartInterval] = useState<string | undefined>(
        chartState?.interval,
    );

    const dataFeedRef = useRef<CustomDataFeedType | null>(null);

    const { debugToolbarOpen, setDebugToolbarOpen } = useAppStateStore();
    const debugToolbarOpenRef = useRef(debugToolbarOpen);
    debugToolbarOpenRef.current = debugToolbarOpen;

    const { marketId } = useParams<{ marketId: string }>();

    const [isChartReady, setIsChartReady] = useState(false);
    useEffect(() => {
        const res = getChartLayout();
        if (res?.interval) {
            setChartInterval(res.interval);
        }
        setChartState(res);
    }, [i18n.language]);

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
                const volumeStudies = chart
                    .activeChart()
                    .getAllStudies()
                    .filter((x) => x.name === 'Volume');

                if (volumeStudies) {
                    volumeStudies.forEach((item) => {
                        const volume = chart
                            .activeChart()
                            .getStudyById(item.id);
                        volume.applyOverrides({
                            'volume.color.0': c.sell,
                            'volume.color.1': c.buy,
                        });
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

            chart.subscribe('study_event', (studyId) => {
                const studyElement = chart.activeChart().getStudyById(studyId);

                const colors = getBsColor();
                studyElement.applyOverrides({
                    'volume.color.0': colors.sell,
                    'volume.color.1': colors.buy,
                });
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

    const initChart = useCallback(async () => {
        if (typeof window === 'undefined') return;

        if (!info || !tradingviewLib?.widget) return;

        dataFeedRef.current = createDataFeed(info, addToFetchedChannels);

        const processedSymbol = processSymbolUrlParam(marketId || 'BTC');

        const tvWidget = new tradingviewLib.widget({
            container: 'tv_chart',
            library_path: defaultProps.libraryPath,
            timezone: 'Etc/UTC',
            symbol: processedSymbol,
            fullscreen: false,
            autosize: true,
            datafeed: dataFeedRef.current as IBasicDataFeed,
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
            locale: mapI18nToTvLocale(i18n.language) as LanguageCode,
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

        tvWidget.headerReady().then(() => {
            setChartLoadingStatus('ready');
        });
        // tvWidget.headerReady().then(() => {
        //     const liquidationsButton = tvWidget.createButton();

        //     let isToggled = false;

        //     const updateButtonStyle = () => {
        //         const svg = getLiquidationsSvgIcon(
        //             isToggled ? '#7371fc' : '#cbcaca',
        //         );
        //         liquidationsButton.style.color = isToggled
        //             ? '#7371fc'
        //             : '#cbcaca';

        //         liquidationsButton.innerHTML = `
        //             <span class="liquidations-wrapper" style="display: flex; align-items: center;border-radius:4px;padding:5px">
        //               ${svg}
        //              <span style="padding-left:3px"> Liquidations
        //              </span>`;
        //     };

        //     updateButtonStyle();

        //     const onClick = () => {
        //         isToggled = !isToggled;
        //         updateButtonStyle();

        //         if (isToggled) {
        //             console.log('Open');
        //         } else {
        //             console.log('Close');
        //         }
        //     };
        //     const onMouseEnter = () => {
        //         const wrapper = liquidationsButton.querySelector(
        //             '.liquidations-wrapper',
        //         ) as HTMLDivElement;
        //         if (wrapper) {
        //             wrapper.style.backgroundColor = '#313030';
        //         }
        //     };
        //     const onMouseLeave = () => {
        //         const wrapper = liquidationsButton.querySelector(
        //             '.liquidations-wrapper',
        //         ) as HTMLDivElement;
        //         if (wrapper) wrapper.style.backgroundColor = 'transparent';
        //     };

        //     liquidationsButton.addEventListener('click', onClick);
        //     liquidationsButton.addEventListener('mouseenter', onMouseEnter);
        //     liquidationsButton.addEventListener('mouseleave', onMouseLeave);

        //     return () => {
        //         liquidationsButton.removeEventListener('click', onClick);
        //         liquidationsButton.removeEventListener(
        //             'mouseenter',
        //             onMouseEnter,
        //         );
        //         liquidationsButton.removeEventListener(
        //             'mouseleave',
        //             onMouseLeave,
        //         );
        //     };
        // });

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
            tvWidget
                .chart()
                .onIntervalChanged()
                .subscribe(null, (interval: ResolutionString) => {
                    setChartInterval(interval);
                    if (typeof plausible === 'function') {
                        plausible('Resolution Update', {
                            props: {
                                resolutionType: 'chart',
                                resolution: interval,
                            },
                        });
                    }
                });

            setChart(tvWidget);
        });
    }, [chartState, info, tradingviewLib, marketId]);

    useEffect(() => {
        setIsChartReady(false);
        if (chart) {
            setChart(null);
        }
        initChart();

        return () => {
            try {
                if (chart) {
                    drawingEventUnsubscribe(chart);
                    studyEventsUnsubscribe(chart);
                    intervalChangedUnsubscribe(chart);
                    visibleRangeChangedUnsubscribe(chart);
                    chart.remove();
                }
            } catch (error) {
                console.error(error);
            }
        };
    }, [chartState, info, i18n.language, initChart, tradingviewLib, marketId]);

    const tvIntervalToMinutes = useCallback((interval: ResolutionString) => {
        let coef = 1;

        if (!interval) return 1;

        if (interval.includes('D')) {
            coef = 24 * 60;
        } else if (interval.includes('W')) {
            coef = 24 * 60 * 7;
        } else if (interval.includes('M')) {
            coef = 60 * 24 * 30;
        }

        const intervalNum = Number(interval.replace(/[^0-9]/g, ''));

        return intervalNum * coef;
    }, []);

    useEffect(() => {
        const chartDiv = document.getElementById('tv_chart');
        const iframe = chartDiv?.querySelector('iframe') as HTMLIFrameElement;
        const iframeDoc =
            iframe?.contentDocument || iframe?.contentWindow?.document;

        const blockSymbolSearchKeys = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            const isInInput = target && target.tagName === 'INPUT';
            const isInTextArea = target && target.tagName === 'TEXTAREA';

            if (isInInput || isInTextArea) return;

            const isSingleChar = e.key.length === 1;
            const isAlphaNumeric = /^[a-zA-Z0-9]$/.test(e.key);

            if (e.code === 'KeyD' && e.altKey) {
                e.preventDefault();
                setDebugToolbarOpen(!debugToolbarOpenRef.current);
            }
            if (
                !e.ctrlKey &&
                !e.altKey &&
                !e.metaKey &&
                isSingleChar &&
                isAlphaNumeric
            ) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        iframeDoc?.addEventListener('keydown', blockSymbolSearchKeys, true);

        return () => {
            iframeDoc?.removeEventListener(
                'keydown',
                blockSymbolSearchKeys,
                true,
            );
        };
    }, [chart]);

    useEffect(() => {
        if (lastAwakeMs > lastSleepMs && lastSleepMs > 0) {
            const intervalMinutes = tvIntervalToMinutes(
                chartInterval as ResolutionString,
            );
            const lastSleepDurationInMinutes = parseFloat(
                ((lastAwakeMs - lastSleepMs) / 60000).toFixed(2),
            );

            if (intervalMinutes <= lastSleepDurationInMinutes) {
                chart?.resetCache();
                chart?.chart().resetData();
                chart?.chart().restoreChart();
            }
        }
    }, [lastSleepMs, lastAwakeMs, chartInterval, initChart, chart, symbol]);

    useEffect(() => {
        if (chart) {
            setIsChartReady(false);
            const chartRef = chart.chart();
            chartRef.setSymbol(symbol);
            saveChartLayout(chart);
        }
    }, [symbol]);

    useEffect(() => {
        if (dataFeedRef.current && userAddress && chart) {
            chart.chart().clearMarks();
            dataFeedRef.current.updateUserAddress(userAddress);
            getMarkFillData(symbol, userAddress);
            chart.chart().refreshMarks();
        }
    }, [userAddress, chart, symbol]);

    useEffect(() => {
        if (!chart) return;
        drawingEvent(chart);
        studyEvents(chart);
        intervalChangedSubscribe(chart, setIsChartReady);
        visibleRangeChangedSubscribe(chart);
    }, [chart]);

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
