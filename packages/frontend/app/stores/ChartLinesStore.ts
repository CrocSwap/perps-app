import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChartLayout } from '~/routes/chart/data/utils/utils';
import type { LineData } from '~/routes/chart/orders/component/LineComponent';

export const CHART_LINES_KEY = 'perps.tv.chart.lines';

interface ChartLinesStore {
    obPreviewLine: LineData | null;
    setObPreviewLine: (line: LineData | null) => void;
}

export const useChartLinesStore = create<ChartLinesStore>((set) => ({
    obPreviewLine: null,
    setObPreviewLine: (line: LineData | null) =>
        set({ obPreviewLine: line ?? null }),
}));
