import { useEffect, useState } from 'react';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import type { HorizontalLineData } from '../LiqudationLines';

export const useLiqudationLines = (): HorizontalLineData[] => {
    const { liqBuys, liqSells } = useOrderBookStore();

    const [lines, setLines] = useState<HorizontalLineData[]>([]);

    const getLineWidth = (ratio: number) => {
        if (ratio >= 1) return 8;
        if (ratio > 0.05) return 4;
        if (ratio > 0.01) return 3;
        return 2;
    };

    const getColor = (ratio: number) => {
        if (ratio >= 1) return '#FDE725';
        if (ratio > 0.05) return '#2BAE7D';
        if (ratio > 0.01) return '#287D8D';
        return '#461668';
    };

    const getDash = (ratio: number) => (ratio >= 1 ? undefined : [1, 2]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapToLines = (arr: any[]): HorizontalLineData[] => {
        return arr.map((item) => {
            const color = getColor(item.ratio);
            const lineWidth = getLineWidth(item.ratio);
            const dash = getDash(item.ratio);
            return {
                yPrice: item.px,
                color: color,
                strokeStyle: color,
                lineWidth,
                type: item.type,
                dash,
                globalAlpha: 0.6,
            };
        });
    };

    useEffect(() => {
        const lines: HorizontalLineData[] = [
            ...mapToLines(liqBuys),
            ...mapToLines(liqSells),
        ];

        setLines(lines);
    }, [JSON.stringify(liqBuys), JSON.stringify(liqSells)]);

    return lines;
};
