import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const CHART_LAYOUT_KEY = 'perps.tv.chart.layout';

interface ChartStore {
    layout: object | null;
    saveLayout: (layout: object) => void;
    loadLayout: () => object | null;
}

export const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            layout: null,
            saveLayout: (layout) => set({ layout }),
            loadLayout: () => get().layout,
        }),
        {
            name: CHART_LAYOUT_KEY,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
