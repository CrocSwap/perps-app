import type {
    IDatafeedChartApi,
    LibrarySymbolInfo,
    Mark,
} from '~/tv/charting_library/charting_library';
import { getHistoricalData, getMarkFillData } from './candleDataCache';
import {
    mapResolutionToInterval,
    resolutionToSeconds,
    resolutionToSecondsMiliSeconds,
    supportedResolutions,
} from './utils/utils';
import { processWSCandleMessage } from './processChartData';

export const createDataFeed = (
    subscribe: (channel: string, payload: any) => void,
): IDatafeedChartApi =>
    ({
        searchSymbols: (userInput: string, exchange, symbolType, onResult) => {
            onResult([
                {
                    symbol: userInput,
                    description: 'Sample Symbol',
                    exchange: exchange,
                    type: symbolType,
                },
            ]);
        },

        onReady: (cb: any) => {
            cb({
                supported_resolutions: supportedResolutions,
                supports_marks: true,
            }),
                //   exchanges: [
                //     { value: "BINANCE", name: "Binance", desc: "Binance Exchange" },
                //     { value: "NASDAQ", name: "NASDAQ", desc: "NASDAQ Exchange" },
                // ],
                // supports_marks: false,
                // supports_time: true,

                0;
        },

        resolveSymbol: (symbolName, onResolve, onError) => {
            const symbolInfo: LibrarySymbolInfo = {
                ticker: symbolName,
                name: symbolName,
                minmov: 1,
                pricescale: 1000,
                timezone: 'Etc/UTC',
                session: '24x7',
                has_intraday: true,
                supported_resolutions: supportedResolutions,
                description: '',
                type: '',
                exchange: '',
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

            if (symbol) {
                try {
                    const bars = await getHistoricalData(
                        symbol,
                        resolution,
                        from,
                        to,
                    );

                    bars && onResult(bars, { noData: bars.length === 0 });
                } catch (error) {
                    console.error('Error loading historical data:', error);
                }
            }
        },

        getMarks: async (symbolInfo, from, to, onDataCallback, resolution) => {
            const bSideOrderHistoryMarks: Map<string, Mark> = new Map();
            const aSideOrderHistoryMarks: Map<string, Mark> = new Map();

            const fillMarks = (payload: any) => {
                const floorMode = resolutionToSecondsMiliSeconds(resolution);

                payload.forEach((element: any, index: number) => {
                    const isBuy = element.side === 'B';

                    const markerColor = isBuy ? '#26a69a' : '#ef5350';

                    const markData = {
                        id: index,
                        time:
                            (Math.floor(element.time / floorMode) * floorMode) /
                            1000,
                        color: {
                            border: markerColor,
                            background: markerColor,
                        },
                        text: element.dir + ' at ' + element.px,
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

            try {
                const fillHistory = await getMarkFillData(
                    '0x1cFd5AAa6893f7d91e2A0aA073EB7f634e871353',
                    symbolInfo.name,
                );

                fillHistory.sort((a, b) => a.px - b.px);

                fillMarks(fillHistory);

                const markArray = [
                    ...bSideOrderHistoryMarks.values(),
                    ...aSideOrderHistoryMarks.values(),
                ];

                if (markArray.length > 0) {
                    onDataCallback(markArray);
                }

                subscribe('userFills', {
                    payload: {
                        user: '0x1cFd5AAa6893f7d91e2A0aA073EB7f634e871353',
                    },
                    handler: async (payload: any, index: number) => {
                        if (symbolInfo.name === payload.fills[0].coin) {
                            payload.fills.forEach((fill: any) => {
                                const key = fillHistory.find(
                                    (hs) => hs.hash === fill.hash,
                                );

                                if (key === undefined) {
                                    fillHistory.push(fill);
                                }
                            });
                        }

                        fillMarks(fillHistory);

                        const markArray = [
                            ...bSideOrderHistoryMarks.values(),
                            ...aSideOrderHistoryMarks.values(),
                        ];

                        if (markArray.length > 0) {
                            onDataCallback(markArray);
                        }
                    },
                });
            } catch (error) {
                console.error('Error fetching marks:', error);
            }
        },

        subscribeBars: (symbolInfo, resolution, onTick) => {
            subscribe('candle', {
                payload: {
                    coin: symbolInfo.ticker,
                    interval: mapResolutionToInterval(resolution),
                },
                handler: (payload: any) => {
                    if (payload.s === symbolInfo.ticker) {
                        onTick(processWSCandleMessage(payload));
                    }
                },
                single: true,
            });
            // subscribeOnStream(symbolInfo, resolution, onTick);
        },

        unsubscribeBars: (listenerGuid) => {
            clearInterval((window as any)[listenerGuid]);
            delete (window as any)[listenerGuid];
        },
    } as IDatafeedChartApi);
