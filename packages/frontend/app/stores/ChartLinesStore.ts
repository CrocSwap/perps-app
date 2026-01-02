import { create } from 'zustand';
import type { LineData } from '~/routes/chart/orders/component/LineComponent';

export const CHART_LINES_KEY = 'perps.tv.chart.lines';

interface ChartLinesStore {
    obPreviewLine: LineData | null;
    setObPreviewLine: (line: LineData | null) => void;

    selectedOrderLine: LineData | undefined;
    setSelectedOrderLine: (line: LineData | undefined) => void;
}

export const useChartLinesStore = create<ChartLinesStore>((set) => ({
    obPreviewLine: null,
    setObPreviewLine: (line: LineData | null) =>
        set({ obPreviewLine: line ?? undefined }),

    selectedOrderLine: undefined,
    setSelectedOrderLine: (line: LineData | undefined) =>
        set({ selectedOrderLine: line ?? undefined }),
}));
