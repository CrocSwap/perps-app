import type { Info } from '@perps-app/sdk';
import type {
    IDatafeedChartApi,
    LibrarySymbolInfo,
    Mark,
} from '~/tv/charting_library/charting_library';
import { WsChannels } from '~/utils/Constants';
import {
    getHistoricalData,
    getMarkColorData,
    getMarkFillData,
} from './candleDataCache';
import { processWSCandleMessage } from './processChartData';
import {
    mapResolutionToInterval,
    resolutionToSecondsMiliSeconds,
    supportedResolutions,
} from './utils/utils';
export const createDataFeed = (info: Info | null): IDatafeedChartApi =>
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
                minmov: 0.01,
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

            const chartTheme = getMarkColorData();

            const fillMarks = (payload: any) => {
                const floorMode = resolutionToSecondsMiliSeconds(resolution);

                payload.forEach((element: any, index: number) => {
                    const isBuy = element.side === 'B';

                    const markerColor = isBuy
                        ? chartTheme.buy
                        : chartTheme.sell;

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

            const markRes = (await getMarkFillData(
                symbolInfo.name,
                // debugWallet.address,
            )) as any;

            const fillHistory = markRes.dataCache;
            // const userWallet = markRes.user;

            if (fillHistory) {
                fillHistory.sort((a: any, b: any) => b.time - a.time);

                fillMarks(fillHistory);
            }
            const markArray = [
                ...bSideOrderHistoryMarks.values(),
                ...aSideOrderHistoryMarks.values(),
            ];

            if (markArray.length > 0) {
                onDataCallback(markArray);
            }

            // subscribe('userFills', {
            //     payload: {
            //         user: userWallet,
            //     },
            //     handler: (payload: any) => {
            //         if (symbolInfo.name === payload.fills[0].coin) {
            //             getMarkFillData(
            //                 symbolInfo.name,
            //                 // debugWallet.address,
            //             ).then((res: any) => {
            //                 const fetchedData = res.dataCache;
            //                 const diffArry: any[] = [];

            //                 payload.fills.forEach((fill: any) => {
            //                     const key = fetchedData.find(
            //                         (hs: any) => hs.hash === fill.hash,
            //                     );
            //                     if (key === undefined) {
            //                         diffArry.push(fill);
            //                     }
            //                 });

            //                 fillMarks(diffArry);

            //                 const markArray = [
            //                     ...bSideOrderHistoryMarks.values(),
            //                     ...aSideOrderHistoryMarks.values(),
            //                 ];

            //                 if (markArray.length > 0) {
            //                     onDataCallback(markArray);
            //                 }
            //             });
            //         }
            //     },
            // });
        },

        subscribeBars: (symbolInfo, resolution, onTick) => {
            if (!info) return console.log('SDK is not ready');
            info.subscribe(
                {
                    type: WsChannels.CANDLE,
                    coin: symbolInfo.ticker || '',
                    interval: mapResolutionToInterval(resolution),
                },
                (payload: any) => {
                    if (payload.data.s === symbolInfo.ticker) {
                        onTick(processWSCandleMessage(payload.data));
                    }
                },
            );
            // subscribeOnStream(symbolInfo, resolution, onTick);
        },

        unsubscribeBars: (listenerGuid) => {
            clearInterval((window as any)[listenerGuid]);
            delete (window as any)[listenerGuid];
        },
    }) as IDatafeedChartApi;
