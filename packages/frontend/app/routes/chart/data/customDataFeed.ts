/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Info } from '@perps-app/sdk';
import type {
    IDatafeedChartApi,
    LibrarySymbolInfo,
    Mark,
    OnReadyCallback,
} from '~/tv/charting_library/charting_library';
import {
    POLLING_API_URL,
    TIMEOUT_CANDLE_POLLING,
    WsChannels,
} from '~/utils/Constants';
import {
    getHistoricalData,
    getMarkColorData,
    getMarkFillData,
    updateCandleCache,
    updateMarkDataWithSubscription,
} from './candleDataCache';
import {
    processLastCandleWithPx,
    processWSCandleMessage,
} from './processChartData';
import {
    convertResolutionToIntervalParam,
    mapResolutionToInterval,
    resolutionToSecondsMiliSeconds,
    supportedResolutions,
    getCurrentCandleTime,
} from './utils/utils';
import type { Bar } from '~/tv/charting_library';

const subscriptions = new Map<string, { unsubscribe: () => void }>();

export type CustomDataFeedType = IDatafeedChartApi & {
    updateUserAddress: (address: string) => void;
    updateLastPrice: (symbol: string, price: number) => void;
} & { onReady(callback: OnReadyCallback): void };

export const createDataFeed = (
    info: Info | null,
    addToFetchedChannels: (channel: string) => void,
): CustomDataFeedType => {
    let currentUserAddress = '';
    const updateUserAddress = (newAddress: string) => {
        currentUserAddress = newAddress;
    };
    let lastBarMap: Map<string, Bar | null> = new Map();
    let lastPriceMap: Map<string, number> = new Map();
    const updateLastPrice = (symbol: string, price: number) => {
        lastPriceMap.set(symbol, price);
    };
    const datafeed: IDatafeedChartApi & {
        updateUserAddress: (address: string) => void;
        updateLastPrice: (symbol: string, price: number) => void;
    } = {
        searchSymbols: (userInput: string, exchange, symbolType, onResult) => {
            onResult([]);
        },

        onReady: (cb: any) => {
            (cb({
                supported_resolutions: supportedResolutions,
                supports_marks: true,
            }),
                //   exchanges: [
                //     { value: "BINANCE", name: "Binance", desc: "Binance Exchange" },
                //     { value: "NASDAQ", name: "NASDAQ", desc: "NASDAQ Exchange" },
                // ],
                // supports_marks: false,
                // supports_time: true,

                0);
        },

        resolveSymbol: (symbolName, onResolve, onError) => {
            const symbolInfo: LibrarySymbolInfo = {
                ticker: symbolName,
                name: symbolName,
                minmov: 0.01,
                pricescale: 1000,
                timezone: 'Etc/UTC',
                session: '24x7',
                has_intraday: true,
                supported_resolutions: supportedResolutions,
                description: '',
                type: '',
                exchange: 'Ambient',
                listed_exchange: '',
                format: 'price',
            };
            onResolve(symbolInfo);
        },

        getBars: async (
            symbolInfo,
            resolution,
            periodParams,
            onResult,
            onError,
        ) => {
            /**
             * for fetching historical data
             */
            const { from, to } = periodParams;
            const symbol = symbolInfo.ticker;

            const currentCandleTime = getCurrentCandleTime(resolution);

            if (symbol) {
                try {
                    const bars = await getHistoricalData(
                        symbol,
                        resolution,
                        from,
                        to,
                    );

                    if (bars && bars.length > 0) {
                        const last = bars.reduce((latest, current) => {
                            return current.time > latest.time
                                ? current
                                : latest;
                        });
                        const lastBar = lastBarMap.get(
                            `${symbol}-${resolution}`,
                        );
                        if (lastBar) {
                            if (last.time > lastBar.time) {
                                lastPriceMap.set(symbol, last.close);
                                lastBarMap.set(`${symbol}-${resolution}`, last);
                            }
                        } else {
                            // lastBar = last;
                            lastBarMap.set(`${symbol}-${resolution}`, last);
                        }
                    }

                    bars && onResult(bars, { noData: bars.length === 0 });
                } catch (error) {
                    console.error('Error loading historical data:', error);
                }
            }
        },

        getMarks: async (symbolInfo, from, to, onDataCallback, resolution) => {
            const bSideOrderHistoryMarks: Map<string, Mark> = new Map();
            const aSideOrderHistoryMarks: Map<string, Mark> = new Map();

            const chartTheme = getMarkColorData();

            const fillMarks = (payload: any) => {
                const floorMode = resolutionToSecondsMiliSeconds(resolution);

                payload.forEach((element: any, index: number) => {
                    const isBuy = element.side === 'B';

                    const markerColor = isBuy
                        ? chartTheme.buy
                        : chartTheme.sell;

                    const markData = {
                        id: element.oid,
                        time:
                            (Math.floor(element.time / floorMode) * floorMode) /
                            1000,
                        color: {
                            border: markerColor,
                            background: markerColor,
                        },
                        text: element.dir + ' at ' + element.px,
                        px: element.px,
                        label: isBuy ? 'B' : 'S',
                        labelFontColor: 'white',
                        minSize: 15,
                        borderWidth: 0,
                        hoveredBorderWidth: 1,
                    };

                    if (isBuy) {
                        bSideOrderHistoryMarks.set(element.oid, markData);
                    } else {
                        aSideOrderHistoryMarks.set(element.oid, markData);
                    }
                });
            };

            const markRes = (await getMarkFillData(
                symbolInfo.name,
                currentUserAddress,
            )) as any;

            if (!markRes) return;

            const fillHistory = markRes.dataCache;
            const userWallet = markRes.user;

            if (fillHistory) {
                fillHistory.sort((a: any, b: any) => b.time - a.time);

                fillMarks(fillHistory);
            }
            const markArray = [
                ...bSideOrderHistoryMarks.values(),
                ...aSideOrderHistoryMarks.values(),
            ];

            if (markArray.length > 0) {
                markArray.sort((a: any, b: any) => b.px - a.px);

                onDataCallback(markArray);
            }

            if (!info) return console.log('SDK is not ready');
            setTimeout(() => {
                info.subscribe(
                    {
                        type: WsChannels.USER_FILLS,
                        user: userWallet,
                    },
                    (payload: any) => {
                        addToFetchedChannels(WsChannels.USER_FILLS);
                        if (!payload || !payload.data) return;

                        const fills = payload.data.fills;
                        if (!fills || fills.length === 0) return;

                        const poolFills = fills.filter(
                            (fill: any) => fill.coin === symbolInfo.name,
                        );

                        if (poolFills.length === 0) return;

                        poolFills.sort((a: any, b: any) => b.time - a.time);

                        fillMarks(poolFills);

                        updateMarkDataWithSubscription(
                            symbolInfo.name,
                            poolFills,
                            userWallet,
                        );

                        const markArray = [
                            ...bSideOrderHistoryMarks.values(),
                            ...aSideOrderHistoryMarks.values(),
                        ];

                        if (markArray.length > 0) {
                            markArray.sort((a: any, b: any) => b.px - a.px);

                            onDataCallback(markArray);
                        }
                    },
                );
            }, 500);
        },

        subscribeBars: (symbolInfo, resolution, onTick, listenerGuid) => {
            const poller = setInterval(() => {
                const lastBar = lastBarMap.get(
                    `${symbolInfo.ticker as string}-${resolution}`,
                );
                const lastPrice =
                    lastPriceMap.get(symbolInfo.ticker as string) || 0;
                if (!lastBar) return;
                if (lastPrice === 0) return;

                const currentCandleTime = getCurrentCandleTime(resolution);
                let updatedBar;
                if (lastBar.time < currentCandleTime) {
                    onTick(lastBar);

                    updatedBar = processLastCandleWithPx(
                        lastBar as Bar,
                        lastPrice,
                        resolution,
                        true,
                    );
                    lastBarMap.set(
                        `${symbolInfo.ticker as string}-${resolution}`,
                        updatedBar,
                    );
                    // lastBar = updatedBar;
                } else {
                    updatedBar = processLastCandleWithPx(
                        lastBar as Bar,
                        lastPrice,
                        resolution,
                    );
                    // console.log(
                    //     '>>> update bar as with last candle',
                    //     updatedBar,
                    // );
                }

                if (updatedBar) {
                    onTick(updatedBar);
                    updateCandleCache(
                        symbolInfo.ticker as string,
                        resolution,
                        updatedBar,
                    );
                }
            }, 200);
            const unsubscribe = () => clearInterval(poller);
            subscriptions.set(listenerGuid, { unsubscribe });
        },

        unsubscribeBars: (listenerGuid) => {
            const subscription = subscriptions.get(listenerGuid);
            if (subscription) {
                try {
                    subscription.unsubscribe();
                } catch (error) {
                    console.warn(
                        `Failed to unsubscribe for listenerGuid ${listenerGuid}:`,
                        error,
                    );
                }

                subscriptions.delete(listenerGuid);
            } else {
                console.warn(
                    `No active subscription found for listenerGuid: ${listenerGuid}`,
                );
            }
        },

        updateUserAddress,
        updateLastPrice,
    } as CustomDataFeedType;

    return datafeed as CustomDataFeedType;
};
