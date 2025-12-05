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
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import {
    clearAllChartCaches,
    clearChartCachesForSymbol,
    getMarkFillData,
} from '~/routes/chart/data/candleDataCache';
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
import {
    useOrderPlacementStore,
    type TradeType,
} from '~/routes/chart/hooks/useOrderPlacement';

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
    const { toggleQuickMode, openQuickModeConfirm, resetQuickModeState } =
        useOrderPlacementStore();

    const session = useSession();
    const isSessionEstablished = isEstablished(session);

    const { info, lastSleepMs, lastAwakeMs } = useSdk();

    const { symbol, addToFetchedChannels } = useTradeDataStore();

    const previousSymbolRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isSessionEstablished) {
            resetQuickModeState();
        }
    }, [isSessionEstablished, resetQuickModeState]);

    const [chartState, setChartState] = useState<ChartLayout | null>();

    const { userAddress } = useUserDataStore();

    const { showBuysSellsOnChart } = useAppOptions();

    const [chartInterval, setChartInterval] = useState<string | undefined>(
        chartState?.interval,
    );

    const dataFeedRef = useRef<CustomDataFeedType | null>(null);

    const { debugToolbarOpen, setDebugToolbarOpen, lastOnlineAt } =
        useAppStateStore();
    const debugToolbarOpenRef = useRef(debugToolbarOpen);
    debugToolbarOpenRef.current = debugToolbarOpen;

    const { marketId } = useParams<{ marketId: string }>();
    const marketIdRef = useRef(marketId);
    useEffect(() => {
        marketIdRef.current = marketId;
    }, [marketId]);

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

    const { confirmOrder } = useOrderPlacementStore();
    const { symbolInfo } = useTradeDataStore();

    const markPx = symbolInfo?.markPx || 1;

    const markPxRef = useRef(markPx);

    useEffect(() => {
        markPxRef.current = markPx;
    }, [markPx]);

    function changeColors(c: colorSetIF): void {
        // make sure the chart exists
        if (chart) {
            chart.applyOverrides({
                // Candles
                'mainSeriesProperties.candleStyle.upColor': c.buy,
                'mainSeriesProperties.candleStyle.downColor': c.sell,
                'mainSeriesProperties.candleStyle.borderColor': c.buy,
                'mainSeriesProperties.candleStyle.borderUpColor': c.buy,
                'mainSeriesProperties.candleStyle.borderDownColor': c.sell,
                'mainSeriesProperties.candleStyle.wickColor': c.buy,
                'mainSeriesProperties.candleStyle.wickUpColor': c.buy,
                'mainSeriesProperties.candleStyle.wickDownColor': c.sell,

                // Hollow candles
                'mainSeriesProperties.hollowCandleStyle.upColor': c.buy,
                'mainSeriesProperties.hollowCandleStyle.downColor': c.sell,
                'mainSeriesProperties.hollowCandleStyle.borderColor': c.buy,
                'mainSeriesProperties.hollowCandleStyle.borderUpColor': c.buy,
                'mainSeriesProperties.hollowCandleStyle.borderDownColor':
                    c.sell,
                'mainSeriesProperties.hollowCandleStyle.wickColor': c.buy,
                'mainSeriesProperties.hollowCandleStyle.wickUpColor': c.buy,
                'mainSeriesProperties.hollowCandleStyle.wickDownColor': c.sell,

                // Bars (also used by HLC bars style per TradingView docs)
                'mainSeriesProperties.barStyle.upColor': c.buy,
                'mainSeriesProperties.barStyle.downColor': c.sell,

                // High-Low (HLC) style
                'mainSeriesProperties.hiloStyle.color': c.buy,
                'mainSeriesProperties.hiloStyle.borderColor': c.buy,
                'mainSeriesProperties.hiloStyle.labelColor': c.buy,
                'mainSeriesProperties.hiloStyle.labelFontColor': c.buy,

                // Heikin Ashi
                'mainSeriesProperties.haStyle.upColor': c.buy,
                'mainSeriesProperties.haStyle.downColor': c.sell,
                'mainSeriesProperties.haStyle.borderColor': c.buy,
                'mainSeriesProperties.haStyle.borderUpColor': c.buy,
                'mainSeriesProperties.haStyle.borderDownColor': c.sell,
                'mainSeriesProperties.haStyle.wickColor': c.buy,
                'mainSeriesProperties.haStyle.wickUpColor': c.buy,
                'mainSeriesProperties.haStyle.wickDownColor': c.sell,

                // Line / step line / line with markers
                'mainSeriesProperties.lineStyle.color': c.buy,
                'mainSeriesProperties.steplineStyle.color': c.buy,
                'mainSeriesProperties.lineWithMarkersStyle.color': c.buy,

                // Area
                'mainSeriesProperties.areaStyle.color1': c.buy,
                'mainSeriesProperties.areaStyle.color2': c.buy,
                'mainSeriesProperties.areaStyle.linecolor': c.buy,

                // Baseline
                'mainSeriesProperties.baselineStyle.baselineColor': c.buy,
                'mainSeriesProperties.baselineStyle.topFillColor1': c.buy,
                'mainSeriesProperties.baselineStyle.topFillColor2': c.buy,
                'mainSeriesProperties.baselineStyle.topLineColor': c.buy,
                'mainSeriesProperties.baselineStyle.bottomFillColor1': c.sell,
                'mainSeriesProperties.baselineStyle.bottomFillColor2': c.sell,
                'mainSeriesProperties.baselineStyle.bottomLineColor': c.sell,

                // Column
                'mainSeriesProperties.columnStyle.upColor': c.buy,
                'mainSeriesProperties.columnStyle.downColor': c.sell,

                // HLC area
                'mainSeriesProperties.hlcAreaStyle.highLineColor': c.buy,
                'mainSeriesProperties.hlcAreaStyle.lowLineColor': c.sell,
                // 'mainSeriesProperties.hlcAreaStyle.closeLineColor': c.buy,
                // 'mainSeriesProperties.hlcAreaStyle.highCloseFillColor': c.buy,
                // 'mainSeriesProperties.hlcAreaStyle.closeLowFillColor': c.sell,

                // Kagi
                'mainSeriesProperties.kagiStyle.upColor': c.buy,
                'mainSeriesProperties.kagiStyle.downColor': c.sell,
                'mainSeriesProperties.kagiStyle.upColorProjection': c.buy,
                'mainSeriesProperties.kagiStyle.downColorProjection': c.sell,

                // Price Break
                'mainSeriesProperties.pbStyle.upColor': c.buy,
                'mainSeriesProperties.pbStyle.downColor': c.sell,
                'mainSeriesProperties.pbStyle.upColorProjection': c.buy,
                'mainSeriesProperties.pbStyle.downColorProjection': c.sell,
                'mainSeriesProperties.pbStyle.borderUpColor': c.buy,
                'mainSeriesProperties.pbStyle.borderDownColor': c.sell,
                'mainSeriesProperties.pbStyle.borderUpColorProjection': c.buy,
                'mainSeriesProperties.pbStyle.borderDownColorProjection':
                    c.sell,

                // Point & Figure
                'mainSeriesProperties.pnfStyle.upColor': c.buy,
                'mainSeriesProperties.pnfStyle.downColor': c.sell,
                'mainSeriesProperties.pnfStyle.upColorProjection': c.buy,
                'mainSeriesProperties.pnfStyle.downColorProjection': c.sell,

                // Renko
                'mainSeriesProperties.renkoStyle.upColor': c.buy,
                'mainSeriesProperties.renkoStyle.downColor': c.sell,
                'mainSeriesProperties.renkoStyle.upColorProjection': c.buy,
                'mainSeriesProperties.renkoStyle.downColorProjection': c.sell,
                'mainSeriesProperties.renkoStyle.borderUpColor': c.buy,
                'mainSeriesProperties.renkoStyle.borderDownColor': c.sell,
                'mainSeriesProperties.renkoStyle.borderUpColorProjection':
                    c.buy,
                'mainSeriesProperties.renkoStyle.borderDownColorProjection':
                    c.sell,
                'mainSeriesProperties.renkoStyle.wickUpColor': c.buy,
                'mainSeriesProperties.renkoStyle.wickDownColor': c.sell,

                // Volume candles chart style
                'mainSeriesProperties.volCandlesStyle.upColor': c.buy,
                'mainSeriesProperties.volCandlesStyle.downColor': c.sell,
                'mainSeriesProperties.volCandlesStyle.borderColor': c.buy,
                'mainSeriesProperties.volCandlesStyle.borderUpColor': c.buy,
                'mainSeriesProperties.volCandlesStyle.borderDownColor': c.sell,
                'mainSeriesProperties.volCandlesStyle.wickColor': c.buy,
                'mainSeriesProperties.volCandlesStyle.wickUpColor': c.buy,
                'mainSeriesProperties.volCandlesStyle.wickDownColor': c.sell,
            });

            if (chart) {
                const volumeStudies = chart
                    .activeChart()
                    .getAllStudies()
                    .filter((x: any) => x.name === 'Volume');

                if (volumeStudies) {
                    volumeStudies.forEach((item: any) => {
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
                try {
                    const isReady = chart.chart().dataReady();
                    if (isReady) setIsChartReady(isReady);
                } catch (e) {
                    // Ignore errors during init
                }
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

            chart.subscribe('study_event', (studyId: any) => {
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

        const currentMarketId = marketIdRef.current;
        const processedSymbol = processSymbolUrlParam(currentMarketId || 'BTC');

        const tvWidget = new tradingviewLib.widget({
            container: 'tv_chart',
            library_path: defaultProps.libraryPath,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as any,
            symbol: processedSymbol,
            fullscreen: false,
            autosize: true,
            datafeed: dataFeedRef.current as IBasicDataFeed,
            interval: (chartState?.interval || '1h') as ResolutionString,
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

            // Add Quick Trade Mode controls to header (Toggle + Dropdown)
            tvWidget.headerReady().then(() => {
                const container = tvWidget.createButton({ align: 'left' });
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.marginLeft = '8px';

                const quickButton = document.createElement('button');
                quickButton.style.padding = '8px 12px';
                quickButton.style.backgroundColor = '#2a2e39';
                quickButton.style.border = 'none';
                quickButton.style.borderRadius = '4px 0px 0px 4px';
                quickButton.style.color = '#cbcaca';
                quickButton.style.fontSize = '13px';
                quickButton.style.fontWeight = '500';
                quickButton.style.cursor = 'pointer';
                quickButton.style.height = '30px';
                quickButton.style.display = 'flex';
                quickButton.style.alignItems = 'center';
                quickButton.style.gap = '6px';
                quickButton.style.transition = 'all 0.15s';

                // Lightning Icon
                const lightningIcon = document.createElement('span');
                lightningIcon.innerHTML = `
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
</svg>
`;
                lightningIcon.style.display = 'flex';
                lightningIcon.style.alignItems = 'center';
                lightningIcon.style.justifyContent = 'center';
                lightningIcon.style.color = 'inherit';

                const quickText = document.createElement('span');
                quickText.textContent = 'Quick Trade Mode';

                quickButton.appendChild(quickText);
                quickButton.appendChild(lightningIcon);

                const settingsButton = document.createElement('button');
                settingsButton.style.display = 'flex';
                settingsButton.style.alignItems = 'center';
                settingsButton.style.justifyContent = 'center';
                settingsButton.style.width = '30px';
                settingsButton.style.height = '30px';
                settingsButton.style.backgroundColor = '#1e2029';
                settingsButton.style.border = 'none';
                settingsButton.style.borderRadius = '0px 4px 4px 0px';
                settingsButton.style.color = '#cbcaca';
                settingsButton.style.fontSize = '14px';
                settingsButton.style.cursor = 'pointer';
                settingsButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" fill="#cbcaca" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50"> <path d="M 22.205078 2 A 1.0001 1.0001 0 0 0 21.21875 2.8378906 L 20.246094 8.7929688 C 19.076509 9.1331971 17.961243 9.5922728 16.910156 10.164062 L 11.996094 6.6542969 A 1.0001 1.0001 0 0 0 10.708984 6.7597656 L 6.8183594 10.646484 A 1.0001 1.0001 0 0 0 6.7070312 11.927734 L 10.164062 16.873047 C 9.583454 17.930271 9.1142098 19.051824 8.765625 20.232422 L 2.8359375 21.21875 A 1.0001 1.0001 0 0 0 2.0019531 22.205078 L 2.0019531 27.705078 A 1.0001 1.0001 0 0 0 2.8261719 28.691406 L 8.7597656 29.742188 C 9.1064607 30.920739 9.5727226 32.043065 10.154297 33.101562 L 6.6542969 37.998047 A 1.0001 1.0001 0 0 0 6.7597656 39.285156 L 10.648438 43.175781 A 1.0001 1.0001 0 0 0 11.927734 43.289062 L 16.882812 39.820312 C 17.936999 40.39548 19.054994 40.857928 20.228516 41.201172 L 21.21875 47.164062 A 1.0001 1.0001 0 0 0 22.205078 48 L 27.705078 48 A 1.0001 1.0001 0 0 0 28.691406 47.173828 L 29.751953 41.1875 C 30.920633 40.838997 32.033372 40.369697 33.082031 39.791016 L 38.070312 43.291016 A 1.0001 1.0001 0 0 0 39.351562 43.179688 L 43.240234 39.287109 A 1.0001 1.0001 0 0 0 43.34375 37.996094 L 39.787109 33.058594 C 40.355783 32.014958 40.813915 30.908875 41.154297 29.748047 L 47.171875 28.693359 A 1.0001 1.0001 0 0 0 47.998047 27.707031 L 47.998047 22.207031 A 1.0001 1.0001 0 0 0 47.160156 21.220703 L 41.152344 20.238281 C 40.80968 19.078827 40.350281 17.974723 39.78125 16.931641 L 43.289062 11.933594 A 1.0001 1.0001 0 0 0 43.177734 10.652344 L 39.287109 6.7636719 A 1.0001 1.0001 0 0 0 37.996094 6.6601562 L 33.072266 10.201172 C 32.023186 9.6248101 30.909713 9.1579916 29.738281 8.8125 L 28.691406 2.828125 A 1.0001 1.0001 0 0 0 27.705078 2 L 22.205078 2 z M 23.056641 4 L 26.865234 4 L 27.861328 9.6855469 A 1.0001 1.0001 0 0 0 28.603516 10.484375 C 30.066026 10.848832 31.439607 11.426549 32.693359 12.185547 A 1.0001 1.0001 0 0 0 33.794922 12.142578 L 38.474609 8.7792969 L 41.167969 11.472656 L 37.835938 16.220703 A 1.0001 1.0001 0 0 0 37.796875 17.310547 C 38.548366 18.561471 39.118333 19.926379 39.482422 21.380859 A 1.0001 1.0001 0 0 0 40.291016 22.125 L 45.998047 23.058594 L 45.998047 26.867188 L 40.279297 27.871094 A 1.0001 1.0001 0 0 0 39.482422 28.617188 C 39.122545 30.069817 38.552234 31.434687 37.800781 32.685547 A 1.0001 1.0001 0 0 0 37.845703 33.785156 L 41.224609 38.474609 L 38.53125 41.169922 L 33.791016 37.84375 A 1.0001 1.0001 0 0 0 32.697266 37.808594 C 31.44975 38.567585 30.074755 39.148028 28.617188 39.517578 A 1.0001 1.0001 0 0 0 27.876953 40.3125 L 26.867188 46 L 23.052734 46 L 22.111328 40.337891 A 1.0001 1.0001 0 0 0 21.365234 39.53125 C 19.90185 39.170557 18.522094 38.59371 17.259766 37.835938 A 1.0001 1.0001 0 0 0 16.171875 37.875 L 11.46875 41.169922 L 8.7734375 38.470703 L 12.097656 33.824219 A 1.0001 1.0001 0 0 0 12.138672 32.724609 C 11.372652 31.458855 10.793319 30.079213 10.427734 28.609375 A 1.0001 1.0001 0 0 0 9.6328125 27.867188 L 4.0019531 26.867188 L 4.0019531 23.052734 L 9.6289062 22.117188 A 1.0001 1.0001 0 0 0 10.435547 21.373047 C 10.804273 19.898143 11.383325 18.518729 12.146484 17.255859 A 1.0001 1.0001 0 0 0 12.111328 16.164062 L 8.8261719 11.46875 L 11.523438 8.7734375 L 16.185547 12.105469 A 1.0001 1.0001 0 0 0 17.28125 12.148438 C 18.536908 11.394293 19.919867 10.822081 21.384766 10.462891 A 1.0001 1.0001 0 0 0 22.132812 9.6523438 L 23.056641 4 z M 25 17 C 20.593567 17 17 20.593567 17 25 C 17 29.406433 20.593567 33 25 33 C 29.406433 33 33 29.406433 33 25 C 33 20.593567 29.406433 17 25 17 z M 25 19 C 28.325553 19 31 21.674447 31 25 C 31 28.325553 28.325553 31 25 31 C 21.674447 31 19 28.325553 19 25 C 19 21.674447 21.674447 19 25 19 z"></path> </svg>

`;

                const updateQuickState = () => {
                    const state = useOrderPlacementStore.getState();

                    if (state.quickMode) {
                        quickButton.style.backgroundColor =
                            'var(--accent1-dark, #5f5df0)';
                        quickButton.style.color = '#ffffff';
                    } else {
                        quickButton.style.backgroundColor = '#2a2e39';
                        quickButton.style.color = '#cbcaca';
                    }
                };

                updateQuickState();

                const unsubscribe = useOrderPlacementStore.subscribe(() => {
                    updateQuickState();
                });

                quickButton.addEventListener('click', () => {
                    toggleQuickMode();
                });

                quickButton.addEventListener('mouseenter', () => {
                    const state = useOrderPlacementStore.getState();
                    if (!state.quickMode) {
                        quickButton.style.backgroundColor = '#4a5060';
                    }
                });
                quickButton.addEventListener('mouseleave', updateQuickState);

                settingsButton.addEventListener('click', () => {
                    openQuickModeConfirm();
                });

                settingsButton.addEventListener('mouseenter', () => {
                    settingsButton.style.backgroundColor = '#4a5060';
                });

                settingsButton.addEventListener('mouseleave', () => {
                    settingsButton.style.backgroundColor = '#1e2029';
                });

                container.appendChild(quickButton);
                container.appendChild(settingsButton);

                return () => {
                    unsubscribe();
                };
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
                if (dataFeedRef.current?.destroy) {
                    dataFeedRef.current.destroy();
                }

                clearAllChartCaches();

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
    }, [chartState, info, i18n.language, initChart, tradingviewLib]);

    useEffect(() => {
        if (!chart) return;

        chart.onContextMenu((_unixTime: number, price: number) => {
            const state = useOrderPlacementStore.getState();
            const activeOrder = state.activeOrder;

            const formattedPrice = Number(price.toFixed(2));
            const isAbove = formattedPrice > markPxRef.current;

            if (!activeOrder) {
                const topOrder = isAbove
                    ? {
                          text: `Sell @ ${formattedPrice} limit`,
                          side: 'sell' as const,
                      }
                    : {
                          text: `Buy @ ${formattedPrice} limit`,
                          side: 'buy' as const,
                      };

                const bottomOrder = isAbove
                    ? {
                          text: `Buy @ ${formattedPrice} stop`,
                          side: 'buy' as const,
                      }
                    : {
                          text: `Sell @ ${formattedPrice} stop`,
                          side: 'sell' as const,
                      };

                return [
                    {
                        position: 'top' as const,
                        text: topOrder.text,
                        click: () => {
                            openQuickModeConfirm();
                        },
                    },
                    {
                        position: 'top' as const,
                        text: bottomOrder.text,
                        click: () => {
                            openQuickModeConfirm();
                        },
                    },
                    {
                        position: 'top' as const,
                        text: '-',
                        click: () => {},
                    },
                ];
            }

            const displaySize = `${activeOrder.size} ${activeOrder.currency}`;

            const topOrder = isAbove
                ? {
                      text: `Sell ${displaySize} @ ${formattedPrice} limit`,
                      side: 'sell' as const,
                      type: 'Limit' as const,
                  }
                : {
                      text: `Buy ${displaySize} @ ${formattedPrice} limit`,
                      side: 'buy' as const,
                      type: 'Limit' as const,
                  };

            const bottomOrder = isAbove
                ? {
                      text: `Buy ${displaySize} @ ${formattedPrice} stop`,
                      side: 'buy' as const,
                      type: 'Stop' as const,
                  }
                : {
                      text: `Sell ${displaySize} @ ${formattedPrice} stop`,
                      side: 'sell' as const,
                      type: 'Stop' as const,
                  };

            return [
                {
                    position: 'top' as const,
                    text: topOrder.text,
                    click: () => {
                        confirmOrder({
                            price: formattedPrice,
                            side: topOrder.side,
                            type: activeOrder.type,
                            size: activeOrder.size,
                            currency: activeOrder.currency,
                            timestamp: Date.now(),
                        });
                    },
                },
                {
                    position: 'top' as const,
                    text: bottomOrder.text,
                    click: () => {
                        confirmOrder({
                            price: formattedPrice,
                            side: bottomOrder.side,
                            type: activeOrder.type,
                            size: activeOrder.size,
                            currency: activeOrder.currency,
                            timestamp: Date.now(),
                        });
                    },
                },
                {
                    position: 'top' as const,
                    text: '-',
                    click: () => {},
                },
            ];
        });
    }, [chart]);

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
            if (e.code === 'KeyQ' && e.altKey) {
                e.preventDefault();
                toggleQuickMode();
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

        window.addEventListener('keydown', blockSymbolSearchKeys, true);
        iframeDoc?.addEventListener('keydown', blockSymbolSearchKeys, true);

        return () => {
            window.removeEventListener('keydown', blockSymbolSearchKeys, true);
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

    // Refresh chart when coming back online
    const lastOnlineAtRef = useRef(lastOnlineAt);
    useEffect(() => {
        // Only trigger if lastOnlineAt actually changed (not on initial mount)
        if (
            lastOnlineAt > 0 &&
            lastOnlineAt !== lastOnlineAtRef.current &&
            chart
        ) {
            console.log('>>> Refreshing chart after coming back online');
            lastOnlineAtRef.current = lastOnlineAt;

            // Give the network a moment to stabilize, then refresh
            const timeoutId = setTimeout(() => {
                try {
                    // Clear caches and force a full data reload
                    clearAllChartCaches();
                    chart.activeChart().resetData();
                    chart.activeChart().refreshMarks();
                } catch (e) {
                    console.error('Error refreshing chart after reconnect:', e);
                }
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
        lastOnlineAtRef.current = lastOnlineAt;
    }, [lastOnlineAt, chart]);

    useEffect(() => {
        if (!chart || !symbol) return;

        const previousSymbol = previousSymbolRef.current;
        if (previousSymbol && previousSymbol !== symbol) {
            clearChartCachesForSymbol(previousSymbol);
        }

        previousSymbolRef.current = symbol;

        setIsChartReady(false);
        const chartRef = chart.chart();
        chartRef.setSymbol(symbol);
        saveChartLayout(chart);
    }, [symbol, chart]);

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
