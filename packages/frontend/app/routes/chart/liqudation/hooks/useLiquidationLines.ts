import { useEffect, useMemo, useState } from 'react';
import type { HorizontalLineData } from '../LiqudationLines';
import { useTradeDataStore } from '~/stores/TradeDataStore';

export const useLiqudationLines = (scaleData: any): HorizontalLineData[] => {
    const { symbolInfo } = useTradeDataStore();

    const markPx = symbolInfo?.markPx;
    const [lines, setLines] = useState<HorizontalLineData[]>([]);

    const getLineWidth = (ratio: number) => {
        // if (ratio >= 1) return 8;
        // if (ratio > 0.05) return 4;
        // if (ratio > 0.01) return 3;
        return 8;
    };

    const getColor = (ratio: number) => {
        if (ratio >= 80) return '#FDE725';
        if (ratio > 70) return '#2BAE7D';
        if (ratio > 50) return '#287D8D';
        return '#461668';
    };

    // const getDash = (ratio: number) => (ratio >= 80 ? undefined : [1, 2]);

    function simulateData(markyPrice: number, n = 5000) {
        const min = markyPrice * 0.1;
        const max = markyPrice * 2;
        return Array.from({ length: n }, () => {
            const yPrice = min + Math.random() * (max - min);
            return {
                yPrice: Number(yPrice.toFixed(6)),
                value: Math.random() * 100,
            };
        });
    }

    const liqData = useMemo(() => {
        if (markPx) {
            const data = simulateData(markPx);

            return data;
        }
        return [];
    }, [markPx === undefined]);

    function getBinSize(min: number, max: number, targetRows = 100) {
        const range = max - min;
        return range / targetRows;
    }
    function binData(
        data: { yPrice: number; value: number }[],
        binSize: number,
        min: number,
    ): HorizontalLineData[] {
        if (markPx) {
            const bins: Record<string, { yPrice: number; values: number[] }> =
                {};

            data.forEach((d) => {
                const binIndex = Math.floor((d.yPrice - min) / binSize);
                const binKey = (min + binIndex * binSize).toFixed(6);
                if (!bins[binKey])
                    bins[binKey] = { yPrice: parseFloat(binKey), values: [] };
                bins[binKey].values.push(d.value);
            });

            return Object.values(bins).map((b) => {
                const avgValue =
                    b.values.reduce((a, c) => a + c, 0) / b.values.length;
                const dash = undefined;
                const color = getColor(avgValue);
                const lineWidth = 8;

                return {
                    yPrice: b.yPrice,
                    liqValue: avgValue,
                    color: color,
                    strokeStyle: color,
                    lineWidth,
                    type: b.yPrice > markPx ? 'Short' : 'Long',
                    dash,
                    globalAlpha: 0.4,
                };
            });
        }
        return [];
    }

    useEffect(() => {
        if (scaleData) {
            const dom = scaleData.yScale.domain();
            const minDom = dom[0];
            const maxDom = dom[1];
            const binSize = getBinSize(minDom, maxDom, 100);

            if (markPx) {
                const filteredData = liqData.filter(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (d: any) => d.yPrice >= minDom && d.yPrice <= maxDom,
                );
                const res = binData(filteredData, binSize, minDom);

                setLines(res);
            }
        }
    }, [JSON.stringify(scaleData?.yScale.domain()), liqData]);
    return lines;
};
