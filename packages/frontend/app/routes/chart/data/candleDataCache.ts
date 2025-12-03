import { bsColorSets } from '~/stores/AppSettingsStore';
import { fetchCandles, fetchUserFillsHistory } from './fetchCandleData';
import {
    getChartThemeColors,
    mapResolutionToInterval,
    resolutionToSeconds,
} from './utils/utils';
import type { Bar } from '~/tv/charting_library';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataCache = new Map<string, any[]>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataCacheWithUser = new Map<string, { user: string; dataCache: any[] }>();

const MAX_CANDLES_PER_SERIES = 50000;
const MAX_MARKS_PER_SYMBOL = 5000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimCandleCache(cachedData: any[]) {
    if (cachedData.length > MAX_CANDLES_PER_SERIES) {
        cachedData.splice(0, cachedData.length - MAX_CANDLES_PER_SERIES);
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trimMarkCache(marks: any[]) {
    if (marks.length > MAX_MARKS_PER_SYMBOL) {
        marks.sort((a, b) => a.time - b.time);
        marks.splice(0, marks.length - MAX_MARKS_PER_SYMBOL);
    }
}

export async function getHistoricalData(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
) {
    const key = `${symbol}-${resolution}`;
    const cachedData = dataCache.get(key) || [];

    const candleCount = (to - from) / resolutionToSeconds(resolution);
    const hasDataForRange =
        cachedData.filter(
            (bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
        ).length >= candleCount;

    if (hasDataForRange) {
        return cachedData.filter(
            (bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
        );
    }

    const period = mapResolutionToInterval(resolution);
    const data = await fetchCandles(symbol, period, from, to).then(
        (res: any) => {
            if (res) {
                const formattedData = res.map((item: any) => ({
                    time: item.t,
                    open: Number(item.o),
                    high: Number(item.h),
                    low: Number(item.l),
                    close: Number(item.c),
                    volume: Number(item.v),
                }));

                for (const newBar of formattedData) {
                    const index = cachedData.findIndex(
                        (bar) => bar.time === newBar.time,
                    );

                    if (index > -1) {
                        cachedData[index] = newBar;
                    } else {
                        cachedData.push(newBar);
                    }
                }

                const filteredCandle = cachedData.filter(
                    (bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
                );
                const sortedFiltered = filteredCandle.sort(
                    (a, b) => a.time - b.time,
                );

                trimCandleCache(cachedData);

                dataCache.set(key, cachedData);

                return sortedFiltered;
            }
        },
    );

    return data;
}

export function updateCandleCache(
    symbol: string,
    resolution: string,
    tick: Bar,
) {
    const key = `${symbol}-${resolution}`;
    const cachedData = dataCache.get(key) || [];
    const tickTime = tick.time;

    const lastIndex = cachedData.findIndex((b) => b.time === tickTime);

    if (lastIndex > -1) {
        cachedData[lastIndex] = { ...cachedData[lastIndex], ...tick };
    } else {
        cachedData.push(tick);
    }

    trimCandleCache(cachedData);

    dataCache.set(key, cachedData);
}

export async function getMarkFillData(coin: string, user?: string) {
    const cacheKey = `${coin}-fillData`;

    const cachedData = dataCacheWithUser.get(cacheKey);

    if (
        cachedData &&
        cachedData.dataCache.length > 0 &&
        (!user || user === cachedData.user)
    ) {
        return cachedData;
    }

    if (user) {
        return await fetchUserFillsHistory(user).then((res: any) => {
            const poolFillData: Array<any> = [];

            if (res) {
                res.forEach((element: any) => {
                    if (element.coin === coin) {
                        poolFillData.push(element);
                    }
                });

                trimMarkCache(poolFillData);

                const fetchedDataWithUser = {
                    user: user,
                    dataCache: poolFillData,
                };

                dataCacheWithUser.set(cacheKey, fetchedDataWithUser);

                return fetchedDataWithUser;
            }
        });
    } else {
        return [];
    }
}

export function updateMarkDataWithSubscription(
    coin: string,
    newMarks: any[],
    user: string,
) {
    const cacheKey = `${coin}-fillData`;

    const cachedData = dataCacheWithUser.get(cacheKey);

    if (cachedData) {
        const existingMarks = cachedData.dataCache;

        newMarks.forEach((newMark) => {
            const exists = existingMarks.some(
                (oldMark) => oldMark.oid === newMark.oid,
            );

            if (!exists) {
                existingMarks.push(newMark);
            }
        });

        trimMarkCache(existingMarks);

        const fetchedDataWithUser = {
            user: user,
            dataCache: existingMarks,
        };

        dataCacheWithUser.set(cacheKey, fetchedDataWithUser);
    }
}

export function getMarkColorData() {
    const candleSettings = localStorage.getItem(
        'tradingview.chartproperties.mainSeriesProperties',
    );

    const parsedCandleSettings = candleSettings
        ? JSON.parse(candleSettings)
        : null;

    const chartThemeColors = getChartThemeColors();

    if (parsedCandleSettings?.candleStyle) {
        const {
            upColor,
            downColor,
            borderUpColor,
            borderDownColor,
            wickUpColor,
            wickDownColor,
        } = parsedCandleSettings.candleStyle;

        const activeColors = [
            upColor,
            downColor,
            borderUpColor,
            borderDownColor,
            wickUpColor,
            wickDownColor,
        ];
        const isCustomized = activeColors.some((color) =>
            color?.startsWith('rgba'),
        );

        if (!isCustomized && chartThemeColors) {
            return chartThemeColors;
        }

        return { buy: upColor, sell: downColor };
    }

    if (chartThemeColors) {
        return chartThemeColors;
    }

    return bsColorSets['default'];
}

export function clearChartCachesForSymbol(symbol: string) {
    const candlePrefix = `${symbol}-`;
    for (const key of dataCache.keys()) {
        if (key.startsWith(candlePrefix)) {
            dataCache.delete(key);
        }
    }

    const fillsKey = `${symbol}-fillData`;
    dataCacheWithUser.delete(fillsKey);
}

export function clearAllChartCaches() {
    dataCache.clear();
    dataCacheWithUser.clear();
}
