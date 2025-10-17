import type { Bar, ResolutionString } from '~/tv/charting_library';

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
