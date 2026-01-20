import { create } from 'zustand';
import type { LineData } from '~/routes/chart/orders/component/LineComponent';

export const CHART_LINES_KEY = 'perps.tv.chart.lines';

interface SelectedOrderLine extends LineData {
    originalPrice?: number;
}

interface ChartLinesStore {
    obPreviewLine: LineData | null;
    setObPreviewLine: (line: LineData | null) => void;

    selectedOrderLine: SelectedOrderLine | undefined;
    setSelectedOrderLine: (line: SelectedOrderLine | undefined) => void;

    shouldConfirmOrder: boolean;
    setShouldConfirmOrder: (should: boolean) => void;
}

export const useChartLinesStore = create<ChartLinesStore>((set) => ({
    obPreviewLine: null,
    setObPreviewLine: (line: LineData | null) =>
        set({ obPreviewLine: line ?? undefined }),

    selectedOrderLine: undefined,
    setSelectedOrderLine: (line: SelectedOrderLine | undefined) =>
        set({ selectedOrderLine: line ?? undefined }),

    shouldConfirmOrder: false,
    setShouldConfirmOrder: (should: boolean) =>
        set({ shouldConfirmOrder: should }),
}));
