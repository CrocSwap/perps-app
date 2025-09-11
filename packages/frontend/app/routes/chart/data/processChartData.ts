import type {
    Bar,
    ResolutionString,
} from '~/tv/charting_library/charting_library';
import { getCurrentCandleTime } from './utils/utils';

// transforms ws candle data to Bar object
export const processWSCandleMessage = (payload: any): Bar => {
    try {
        const bar: Bar = {
            time: payload.t,
            open: Number(payload.o),
            high: Number(payload.h),
            low: Number(payload.l),
            close: Number(payload.c),
            volume: Number(payload.v),
        };
        return bar;
    } catch {
        return {
            time: 0,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
        };
    }
};

export const processLastCandleWithPx = (
    lastCandle: Bar,
    px: number,
    resolution: ResolutionString,
    isNewCandle?: boolean,
): Bar => {
    const time = getCurrentCandleTime(resolution);
    if (isNewCandle) {
        return {
            open: lastCandle.close,
            close: px,
            high: px,
            low: px,
            time,
        };
    }
    return {
        ...lastCandle,
        close: px,
        high: px > lastCandle.high ? px : lastCandle.high,
        low: px < lastCandle.low ? px : lastCandle.low,
        time,
    };
};

export const mapResolutionToInterval = (resolution: ResolutionString) => {
    switch (resolution) {
        case '1':
            return '1m';
        case '5':
            return '5m';
        case '15':
            return '15m';
        case '60':
            return '1h';
        case '240':
            return '4h';
        case '1D':
            return '1d';
        default:
            return resolution;
    }
};
