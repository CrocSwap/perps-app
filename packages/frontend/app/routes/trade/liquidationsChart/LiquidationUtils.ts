export type LiqLevelRaw = {
    0: number;
    1: number;
};

export type LiqLevelMessage = {
    market: {
        aggregated: {
            levels: LiqLevelRaw[];
        };
        marketId: number;
        positionCount: number;
        timestamp: number;
    };
};

export type LiqLevel = {
    sz: number;
    type: 'buy' | 'sell';
    px: number;
    ratio?: number; // ratio of the level to the max size of the book side
    cumulativeSz?: number; // cumulative size to that level
    cumulativeRatio?: number; // cumulative ratio to that level
};

export const LIQ_COLOR_TRANSPARENT = 'transparent';
export const LIQ_COLOR_BASE = '#44095f';
export const LIQ_COLOR_MID = '#1e918e';
export const LIQ_COLOR_TOP = '#21c879';
export const LIQ_COLOR_YELLOW = '#FDE725';

const hexToRgb = (hex: string): [number, number, number] => {
    const result =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    return result
        ? [
              parseInt(result[1], 16),
              parseInt(result[2], 16),
              parseInt(result[3], 16),
          ]
        : [0, 0, 0];
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
};

export const interpolateLiqColor = (t: number): string => {
    const [r1, g1, b1] = hexToRgb(LIQ_COLOR_BASE);
    const [r2, g2, b2] = hexToRgb(LIQ_COLOR_MID);
    const [r3, g3, b3] = hexToRgb(LIQ_COLOR_TOP);

    if (t <= 0.5) {
        const localT = t * 2; // normalize 0-0.5 to 0-1
        return rgbToHex(
            r1 + (r2 - r1) * localT,
            g1 + (g2 - g1) * localT,
            b1 + (b2 - b1) * localT,
        );
    } else {
        const localT = (t - 0.5) * 2; // normalize 0.5-1 to 0-1
        return rgbToHex(
            r2 + (r3 - r2) * localT,
            g2 + (g3 - g2) * localT,
            b2 + (b3 - b2) * localT,
        );
    }
};

export const getLiqColorForValue = (
    usdValue: number,
    thresholds: [number, number, number],
): string | null => {
    if (usdValue >= thresholds[2]) {
        return LIQ_COLOR_YELLOW;
    }
    if (usdValue >= thresholds[0]) {
        const progress =
            (usdValue - thresholds[0]) / (thresholds[2] - thresholds[0]);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        return interpolateLiqColor(clampedProgress);
    }
    return null;
};

export const parseLiqLevelRaw = (
    level: LiqLevelRaw,
    type: 'buy' | 'sell',
    cumulativeSz: number,
    maxSz: number,
    totalSz: number,
): LiqLevel => {
    const sz = level[1] / 1e8;
    return {
        sz: sz,
        px: level[0] / 1e6,
        type: type,
        cumulativeSz: cumulativeSz + sz,
        ratio: sz / maxSz,
        cumulativeRatio: (2 * (cumulativeSz + sz)) / totalSz,
    };
};
