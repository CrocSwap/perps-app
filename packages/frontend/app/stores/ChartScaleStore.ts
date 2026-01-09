import { create } from 'zustand';
import * as d3 from 'd3';

export const CHART_SCALE_KEY = 'perps.tv.chart.scale';

interface PriceDomain {
    min: number;
    max: number;
}

export type ScaleData = {
    yScale: d3.ScaleLinear<number, number>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleSymlog: any;
};

interface ChartScaleStore {
    priceDomain: PriceDomain | null;
    setPriceDomain: (domain: PriceDomain | null) => void;
    scaleDataRef: { current: ScaleData | null };
    zoomChanged: boolean;
    setZoomChanged: (zoomChanged: boolean) => void;
}

export const useChartScaleStore = create<ChartScaleStore>((set) => ({
    priceDomain: null,
    setPriceDomain: (domain: PriceDomain | null) =>
        set({ priceDomain: domain }),
    scaleDataRef: { current: null },
    zoomChanged: false,
    setZoomChanged: (zoomChanged: boolean) => set({ zoomChanged }),
}));
