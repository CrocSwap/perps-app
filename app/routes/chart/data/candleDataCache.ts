import { mapResolutionToInterval, resolutionToSeconds } from './utils/utils';
import { fetchCandles, fetchUserFillsHistory, fetchUserOrderHistory } from './fetchCandleData';

const dataCache = new Map<string, any[]>();

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

export async function getMarkFillData(user: string, coin: string) {
    const cacheKey = `${coin}-fillData`;

    const cachedData = dataCache.get(cacheKey) || [];

    if(cachedData && cachedData.length > 0) {
        return cachedData;
    }

    return await fetchUserFillsHistory(user).then((res: any) => {
        const poolFillData = cachedData;

        if (res) {
            res.forEach((element: any) => {
                if (element.coin === coin) {
                    poolFillData.push(element);
                }
            });
            
            dataCache.set(cacheKey, poolFillData);
        }

        return poolFillData;
    });
}

export async function getMarkOrderData(user: string, coin: string) {
    const cacheKey = `${user}-orderData`;

    const cachedData = dataCache.get(cacheKey) || [];

    if(cachedData && cachedData.length > 0) {
        return cachedData;
    }

    return await fetchUserOrderHistory(user).then((res: any) => {
        const poolFillData = cachedData;

        if (res) {
            res.forEach((element: any) => {
                if (element.order.coin === coin) {
                    poolFillData.push(element);
                }
            });
            
            dataCache.set(cacheKey, poolFillData);
        }

        return poolFillData;
    });
}
