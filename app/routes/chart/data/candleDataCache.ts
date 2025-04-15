import { mapResolutionToInterval, resolutionToSeconds } from './utils/utils';
import { fetchCandles, fetchUserFillsHistory } from './fetchCandleData';
import { bsColorSets } from '~/stores/AppSettingsStore';

const dataCache = new Map<string, any[]>();
const dataCacheWithUser = new Map<string, { user: string; dataCache: any[] }>();

export async function getHistoricalData(
    symbol: string,
    resolution: string,
    from: number,
    to: number,
) {
    const key = `${symbol}-${resolution}`;
    let cachedData = dataCache.get(key) || [];

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
    let mergedData = undefined;

    const period = mapResolutionToInterval(resolution);
    return await fetchCandles(symbol, period, from, to).then((res: any) => {
        if (res) {
            const formattedData = res.map((item: any) => ({
                time: item.t,
                open: Number(item.o),
                high: Number(item.h),
                low: Number(item.l),
                close: Number(item.c),
                volume: Number(item.v),
            }));

            mergedData = [...cachedData, ...formattedData].sort(
                (a, b) => a.time - b.time,
            );
            dataCache.set(key, mergedData);

            return mergedData.filter(
                (bar) => bar.time >= from * 1000 && bar.time <= to * 1000,
            );
        }
    });
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

                const fetchedDataWithUser = {
                    user: user,
                    dataCache: poolFillData,
                };

                dataCacheWithUser.set(cacheKey, fetchedDataWithUser);
            }
        });
    }

    return [];
}

export function getMarkColorData() {
    const visualSettings = localStorage.getItem('VISUAL_SETTINGS');
    const candleSettings = localStorage.getItem(
        'tradingview.chartproperties.mainSeriesProperties',
    );

    const parsedCandleSettings = candleSettings
        ? JSON.parse(candleSettings)
        : null;
    const parsedVisualSettings = visualSettings
        ? JSON.parse(visualSettings)
        : null;

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

        if (!isCustomized && parsedVisualSettings?.state?.bsColor) {
            return bsColorSets[parsedVisualSettings.state.bsColor];
        }

        return { buy: upColor, sell: downColor };
    }

    if (parsedVisualSettings?.state?.bsColor) {
        return bsColorSets[parsedVisualSettings.state.bsColor];
    }

    return bsColorSets['default'];
}
